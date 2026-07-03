import { createClient } from "@supabase/supabase-js";

let supabaseClient;
const SESSION_PREFERENCE_KEY = "studyai-session-persistence";

function canUseBrowserStorage() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.localStorage);
  } catch (_error) {
    return false;
  }
}

function getSessionStorageMode() {
  if (!canUseBrowserStorage()) {
    return "local";
  }

  try {
    return window.localStorage.getItem(SESSION_PREFERENCE_KEY) === "session"
      ? "session"
      : "local";
  } catch (_error) {
    return "local";
  }
}

function removeSupabaseLocalAuthItems() {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("sb-"))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch (_error) {
    // Local auth cleanup is best-effort.
  }
}

function removeSupabaseSessionAuthItems() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!window.sessionStorage) {
      return;
    }

    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith("sb-"))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch (_error) {
    // Session auth cleanup is best-effort.
  }
}

const authStorage = {
  getItem(key) {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  },
  setItem(key, value) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (getSessionStorageMode() === "session") {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
        return;
      }

      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } catch (_error) {
      // Auth persistence can fail in restricted storage modes.
    }
  },
  removeItem(key) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch (_error) {
      // Auth storage cleanup is best-effort.
    }
  },
};

export function setSessionPersistencePreference(rememberSession) {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      SESSION_PREFERENCE_KEY,
      rememberSession ? "local" : "session"
    );

    if (rememberSession) {
      removeSupabaseSessionAuthItems();
    } else {
      removeSupabaseLocalAuthItems();
    }
  } catch (_error) {
    // Preference storage is best-effort.
  }
}

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: authStorage,
      },
    });
  }

  return supabaseClient;
}

export function isSupabaseFetchError(error) {
  const message = error?.message || "";

  return (
    message.includes("Failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("NetworkError") ||
    message.includes("Load failed")
  );
}

export async function getCurrentUser() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return { supabase, user: null, error: null };
      }

      return { supabase, user: null, error };
    }

    return { supabase, user: data.user || null, error: null };
  } catch (error) {
    const supabase = supabaseClient || null;

    if (isSupabaseFetchError(error)) {
      try {
        await supabase?.auth.signOut({ scope: "local" });
      } catch (_signOutError) {
        // Local cleanup is best-effort only.
      }
    }

    return {
      supabase,
      user: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unable to connect to Supabase."),
    };
  }
}

export async function getCurrentUserRole() {
  const { supabase, user, error } = await getCurrentUser();

  if (error || !user) {
    return {
      supabase,
      user,
      role: null,
      profile: null,
      error,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      supabase,
      user,
      role: null,
      profile: null,
      error: profileError,
    };
  }

  return {
    supabase,
    user,
    role: profile?.role === "admin" ? "admin" : "user",
    profile,
    error: null,
  };
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
