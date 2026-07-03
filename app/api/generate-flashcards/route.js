import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const allowedCardCounts = [10, 20, 30];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  return { url, anonKey };
}

function createAuthClient(url, anonKey) {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireAuthenticatedUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      user: null,
      error: "Please log in to generate flashcards.",
      status: 401,
    };
  }

  const { url, anonKey } = getSupabaseConfig();
  const supabase = createAuthClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      user: null,
      error: "Your session expired. Please log in again.",
      status: 401,
    };
  }

  return {
    user: data.user,
    error: null,
    status: 200,
  };
}

function getGeminiErrorMessage(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("api key") || message.includes("permission")) {
    return "Gemini API key is invalid or not allowed. Please check GEMINI_API_KEY in .env.local.";
  }

  if (message.includes("quota") || message.includes("429")) {
    return "Gemini quota is not available right now. Please try again later.";
  }

  return "Could not generate flashcards right now. Please try again.";
}

function extractJson(text) {
  const cleanText = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON found in Gemini response.");
  }

  return JSON.parse(cleanText.slice(firstBrace, lastBrace + 1));
}

function buildFallbackFlashcards({ topic, content, totalCards }) {
  const sentences = String(content || topic || "")
    .replace(/\n/g, " ")
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
  const cards = Array.from({ length: totalCards }, (_, index) => {
    const sentence = sentences[index % Math.max(sentences.length, 1)] || topic;

    return {
      front: `Key idea ${index + 1}: ${topic}`,
      back: sentence,
      front_text: `Key idea ${index + 1}: ${topic}`,
      back_text: sentence,
    };
  });

  return { cards };
}

function normalizeFlashcards(rawCards, { topic, content, totalCards }) {
  const cards = Array.isArray(rawCards?.cards) ? rawCards.cards : [];
  const normalizedCards = cards
    .map((card, index) => {
      const front = String(card.front || card.front_text || card.question || "").trim();
      const back = String(card.back || card.back_text || card.answer || "").trim();

      if (!front || !back) {
        return null;
      }

      return {
        id: card.id || `card-${index + 1}`,
        front,
        back,
        front_text: front,
        back_text: back,
      };
    })
    .filter(Boolean)
    .slice(0, totalCards);

  return normalizedCards.length > 0
    ? { cards: normalizedCards }
    : buildFallbackFlashcards({ topic, content, totalCards });
}

function buildFlashcardPrompt({ topic, content, totalCards }) {
  return `Create educational study flashcards for students.

Return only valid JSON. Do not use Markdown. Do not wrap the JSON in code fences.

JSON shape:
{
  "cards": [
    {
      "front": "Question or concept",
      "back": "Answer or explanation"
    }
  ]
}

Rules:
- Create exactly ${totalCards} flashcards.
- The front must be short and test recall.
- The back must explain clearly in 1-3 sentences.
- Mix definitions, concepts, examples, formulas, and exam-style recall where useful.
- Base every flashcard on the provided topic or notes.
- Keep wording student-friendly.

Topic: ${topic}

Study material:
${content.slice(0, 9000)}`;
}

async function generateFlashcards(ai, prompt) {
  const preferredModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const modelList = [
    preferredModel,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ].filter((model, index, models) => model && models.indexOf(model) === index);

  let lastError;

  for (const model of modelList) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      return extractJson(response.text || "");
    } catch (error) {
      lastError = error;

      if ([401, 403, 429].includes(error?.status)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No model generated flashcard JSON.");
}

export async function POST(request) {
  try {
    const auth = await requireAuthenticatedUser(request);

    if (!auth.user) {
      return Response.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const cleanTitle = typeof body.title === "string" ? body.title.trim() : "";
    const topic =
      typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim()
        : cleanTitle || "Study Flashcards";
    const content =
      typeof body.content === "string" && body.content.trim()
        ? body.content.trim()
        : topic;
    const totalCards = allowedCardCounts.includes(Number(body.totalCards))
      ? Number(body.totalCards)
      : allowedCardCounts.includes(Number(body.total_cards))
        ? Number(body.total_cards)
        : 10;

    if (!content) {
      return Response.json({ error: "Topic or notes are required." }, { status: 400 });
    }

    if (content.length > 12000) {
      return Response.json(
        { error: "Please keep your input under 12000 characters." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is missing. Add GEMINI_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const prompt = buildFlashcardPrompt({ topic, content, totalCards });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let rawCards;

    try {
      rawCards = await generateFlashcards(ai, prompt);
    } catch (_error) {
      rawCards = buildFallbackFlashcards({ topic, content, totalCards });
    }

    const flashcards = normalizeFlashcards(rawCards, {
      topic,
      content,
      totalCards,
    }).cards;

    return Response.json({
      deck: {
        topic,
        total_cards: flashcards.length,
        cards: flashcards,
      },
      flashcards,
    });
  } catch (error) {
    return Response.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
