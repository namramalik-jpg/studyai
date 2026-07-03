import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function createServerClient(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getGeminiErrorMessage(error) {
  const message = error?.message || "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("api key") || lowerMessage.includes("permission")) {
    return "Gemini API key is invalid or not allowed. Please check GEMINI_API_KEY in .env.local and restart the server.";
  }

  if (lowerMessage.includes("quota") || lowerMessage.includes("429")) {
    return "Gemini API quota is not available right now. Please try again later.";
  }

  if (lowerMessage.includes("model") || lowerMessage.includes("not found")) {
    return "The selected Gemini model is not available. Please check GEMINI_MODEL in .env.local.";
  }

  return "Something went wrong while generating the chat response.";
}

function buildChatPrompt(messages) {
  const cleanMessages = Array.isArray(messages)
    ? messages
        .filter((message) => message?.content && ["user", "assistant"].includes(message.role))
        .slice(-12)
    : [];

  const conversation = cleanMessages
    .map((message) => `${message.role === "assistant" ? "StudyAI" : "Student"}: ${message.content}`)
    .join("\n\n");

  return `You are StudyAI Chat, a helpful study assistant for students.

Rules:
- Be clear, friendly, and practical.
- Explain concepts simply.
- Use numbered steps when useful.
- Avoid markdown tables unless the student asks.
- Do not claim to have access to files, private data, or tools you do not have.

Conversation:
${conversation}

StudyAI:`;
}

async function generateChatResponse(prompt) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
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
      const text = (response.text || "").trim();

      if (text) {
        return { text, model };
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No Gemini model generated a response.");
}

export async function POST(request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!url || !anonKey) {
      return Response.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    if (!token) {
      return Response.json({ error: "Missing auth token." }, { status: 401 });
    }

    const authClient = createServerClient(url, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const { messages } = await request.json();
    const cleanMessages = Array.isArray(messages) ? messages : [];

    if (cleanMessages.length === 0) {
      return Response.json({ error: "Please send a message first." }, { status: 400 });
    }

    const lastUserMessage = [...cleanMessages].reverse().find((message) => message.role === "user");

    if (!lastUserMessage?.content?.trim()) {
      return Response.json({ error: "Please send a message first." }, { status: 400 });
    }

    if (lastUserMessage.content.length > 4000) {
      return Response.json(
        { error: "Please keep your message under 4000 characters." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error:
            "Chat backend is not configured yet. Add GEMINI_API_KEY in .env.local and restart the server.",
        },
        { status: 503 }
      );
    }

    const result = await generateChatResponse(buildChatPrompt(cleanMessages));

    return Response.json({
      response: result.text,
      model: result.model,
    });
  } catch (error) {
    return Response.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
