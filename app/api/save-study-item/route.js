import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const saveTypes = new Set([
  "notes",
  "summaries",
  "questions",
  "quiz_history",
  "flashcard_decks",
]);

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured.");
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

function getToken(request) {
  return (request.headers.get("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function cleanText(value, fallback = "") {
  return String(value || fallback || "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanContent(value) {
  return String(value || "").trim();
}

function getColumnError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("column") ||
    message.includes("does not exist")
  );
}

function buildInsertPayload(type, body, userId) {
  const title = cleanText(body.title || body.topic || body.question, "Saved Study Item").slice(0, 180);
  const content = cleanContent(body.content || body.answer || body.response);
  const prompt = cleanContent(body.prompt || body.originalText || body.original_text || title);

  if (!content && !["quiz_history", "flashcard_decks"].includes(type)) {
    throw new Error("Generated content is required before saving.");
  }

  if (type === "notes") {
    return {
      full: {
        user_id: userId,
        title,
        prompt,
        generated_notes: content,
        content,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 8) : ["ai-notes"],
        is_pinned: false,
        created_at: new Date().toISOString(),
      },
      fallback: {
        user_id: userId,
        title,
        content,
        created_at: new Date().toISOString(),
      },
      select: "id,title,content,created_at",
    };
  }

  if (type === "summaries") {
    return {
      full: {
        user_id: userId,
        topic: title,
        original_text: prompt,
        generated_summary: content,
        content,
        created_at: new Date().toISOString(),
      },
      fallback: {
        user_id: userId,
        topic: title,
        content,
        created_at: new Date().toISOString(),
      },
      select: "id,topic,content,created_at",
    };
  }

  if (type === "questions") {
    return {
      full: {
        user_id: userId,
        question: title,
        answer: content,
        created_at: new Date().toISOString(),
      },
      fallback: null,
      select: "id,question,answer,created_at",
    };
  }

  if (type === "quiz_history") {
    const quizData = body.quiz_data || body.quizData || body.quiz || {};

    return {
      full: {
        user_id: userId,
        note_id: body.note_id || body.noteId || null,
        topic: title,
        difficulty: ["easy", "medium", "hard"].includes(body.difficulty)
          ? body.difficulty
          : "medium",
        total_questions: Number(body.total_questions || body.totalQuestions || 0),
        score: body.score ?? null,
        quiz_data: quizData,
        created_at: new Date().toISOString(),
      },
      fallback: {
        user_id: userId,
        quiz_data: quizData,
        score: body.score ?? null,
        created_at: new Date().toISOString(),
      },
      select: "id,topic,difficulty,total_questions,score,created_at",
    };
  }

  const cards = body.flashcards_json || body.flashcardsJson || body.deck || {
    cards: Array.isArray(body.cards) ? body.cards : [],
  };

  return {
    full: {
      user_id: userId,
      topic: title,
      flashcards_json: cards,
      total_cards: Number(body.total_cards || body.totalCards || cards?.cards?.length || 0),
      created_at: new Date().toISOString(),
    },
    fallback: null,
    select: "id,topic,total_cards,created_at",
  };
}

async function insertWithFallback(supabase, type, payload) {
  const { data, error } = await supabase
    .from(type)
    .insert(payload.full)
    .select(payload.select)
    .single();

  if (!error) {
    return data;
  }

  if (!payload.fallback || !getColumnError(error)) {
    throw error;
  }

  const fallbackResult = await supabase
    .from(type)
    .insert(payload.fallback)
    .select(payload.select)
    .single();

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return fallbackResult.data;
}

export async function POST(request) {
  try {
    const token = getToken(request);

    if (!token) {
      return Response.json({ error: "Missing auth token." }, { status: 401 });
    }

    const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
    const authClient = createServerClient(url, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await request.json();
    const type = String(body.type || "");

    if (!saveTypes.has(type)) {
      return Response.json({ error: "Unsupported save type." }, { status: 400 });
    }

    const writeClient = serviceRoleKey
      ? createServerClient(url, serviceRoleKey)
      : createServerClient(url, anonKey, token);
    const payload = buildInsertPayload(type, body, userData.user.id);
    const item = await insertWithFallback(writeClient, type, payload);

    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not save study item." },
      { status: 500 }
    );
  }
}
