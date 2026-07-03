import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL or anon key is missing.");
  }

  return { url, anonKey, serviceRoleKey };
}

function createServerClient(url, key, token = "") {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}

async function authorizeAdmin(request, { requireServiceRole = true } = {}) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return { error: "Missing auth token.", status: 401 };
  }

  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const authClient = createServerClient(url, anonKey, token);
  const adminClient = serviceRoleKey ? createServerClient(url, serviceRoleKey) : null;

  if (requireServiceRole && !adminClient) {
    return {
      error: "SUPABASE_SERVICE_ROLE_KEY is missing. Admin write actions require it.",
      status: 500,
    };
  }

  const { data: userData, error: userError } = await authClient.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: "Invalid session.", status: 401 };
  }

  const profileClient = adminClient || authClient;
  const { data: profile, error: profileError } = await profileClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message, status: 500 };
  }

  if (profile?.role !== "admin") {
    return { error: "Admin access required.", status: 403 };
  }

  return {
    authClient,
    adminClient,
    hasServiceRole: Boolean(adminClient),
    token,
    url,
    anonKey,
    requester: userData.user,
  };
}

async function deleteFromTable(supabase, table, column, userId) {
  const { error } = await supabase.from(table).delete().eq(column, userId);

  if (error) {
    const message = error.message || "";
    if (
      message.includes("Could not find the table") ||
      message.includes("does not exist") ||
      message.includes("schema cache")
    ) {
      return;
    }

    throw error;
  }
}

async function deleteProfileImages(supabase, userId) {
  const bucket = supabase.storage.from("avatars");
  const { data, error } = await bucket.list(userId, { limit: 100 });

  if (error) return;

  const paths = (data || []).map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await bucket.remove(paths);
  }
}

async function getAuthUsersMap(adminClient) {
  const usersMap = new Map();
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const users = data?.users || [];
    users.forEach((user) => usersMap.set(user.id, user));

    if (users.length < perPage) break;
    page += 1;
  }

  return usersMap;
}

export async function GET(request) {
  try {
    const auth = await authorizeAdmin(request, { requireServiceRole: false });

    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const readClient = auth.adminClient || auth.authClient;
    const { data: profiles, error: profilesError } = await readClient
      .from("profiles")
      .select("id,full_name,email,avatar_url,role,created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const authUsersMap = auth.adminClient ? await getAuthUsersMap(auth.adminClient) : new Map();
    const users = (profiles || []).map((profile) => {
      const authUser = authUsersMap.get(profile.id);

      return {
        ...profile,
        email: profile.email || authUser?.email || "",
        avatar_url: profile.avatar_url || authUser?.user_metadata?.avatar_url || "",
        last_login: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
      };
    });

    return Response.json({
      users,
      limited: !auth.hasServiceRole,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not load admin users." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await authorizeAdmin(request);

    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { adminClient, requester, token, url, anonKey } = auth;
    const body = await request.json();
    const userId = String(body.userId || "");
    const role = String(body.role || "");

    if (!userId || !["user", "admin"].includes(role)) {
      return Response.json({ error: "Invalid role update." }, { status: 400 });
    }

    if (userId === requester.id && role !== "admin") {
      return Response.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    const authorizedClient = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await authorizedClient
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select("id,full_name,email,avatar_url,role,created_at")
      .single();

    if (error) throw error;

    return Response.json({ user: data });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not update user role." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await authorizeAdmin(request);

    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { adminClient, requester } = auth;
    const body = await request.json();
    const userId = String(body.userId || "");

    if (!userId) {
      return Response.json({ error: "Missing user id." }, { status: 400 });
    }

    if (userId === requester.id) {
      return Response.json(
        { error: "You cannot delete your own admin account from the admin panel." },
        { status: 400 }
      );
    }

    await deleteProfileImages(adminClient, userId);
    await deleteFromTable(adminClient, "chat_messages", "user_id", userId);
    await deleteFromTable(adminClient, "chat_sessions", "user_id", userId);
    await deleteFromTable(adminClient, "user_preferences", "user_id", userId);
    await deleteFromTable(adminClient, "favorites", "user_id", userId);
    await deleteFromTable(adminClient, "ai_history", "user_id", userId);
    await deleteFromTable(adminClient, "flashcard_decks", "user_id", userId);
    await deleteFromTable(adminClient, "flashcards", "user_id", userId);
    await deleteFromTable(adminClient, "quiz_history", "user_id", userId);
    await deleteFromTable(adminClient, "study_planner", "user_id", userId);
    await deleteFromTable(adminClient, "summaries", "user_id", userId);
    await deleteFromTable(adminClient, "questions", "user_id", userId);
    await deleteFromTable(adminClient, "notes", "user_id", userId);
    await deleteFromTable(adminClient, "profiles", "id", userId);

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) throw deleteUserError;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not delete user." },
      { status: 500 }
    );
  }
}
