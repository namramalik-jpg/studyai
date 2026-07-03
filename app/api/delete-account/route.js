import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL or anon key is missing.");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local to enable account deletion."
    );
  }

  return { url, anonKey, serviceRoleKey };
}

function createServerClient(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isMissingTableError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

async function deleteFromTable(supabase, table, column, userId) {
  const { error } = await supabase.from(table).delete().eq(column, userId);

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

async function deleteProfileImages(supabase, userId) {
  const bucket = supabase.storage.from("avatars");
  const { data, error } = await bucket.list(userId, { limit: 100 });

  if (error) {
    return;
  }

  const paths = (data || []).map((file) => `${userId}/${file.name}`);

  if (paths.length > 0) {
    await bucket.remove(paths);
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return Response.json({ error: "Missing auth token." }, { status: 401 });
    }

    const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
    const authClient = createServerClient(url, anonKey);
    const adminClient = createServerClient(url, serviceRoleKey);

    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const userId = userData.user.id;

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

    if (deleteUserError) {
      throw deleteUserError;
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not delete account." },
      { status: 500 }
    );
  }
}
