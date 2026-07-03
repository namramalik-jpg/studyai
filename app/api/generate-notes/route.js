import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
      error: "Please log in to generate AI study material.",
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
  const message = error?.message || "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("api key") || lowerMessage.includes("permission")) {
    return "Gemini API key is invalid or not allowed. Please check GEMINI_API_KEY in .env.local and restart the server.";
  }

  if (lowerMessage.includes("quota") || lowerMessage.includes("429")) {
    return "Gemini API quota is not available right now. Please check your Google AI Studio quota or try again later.";
  }

  if (lowerMessage.includes("model") || lowerMessage.includes("not found")) {
    return "The selected Gemini model is not available. Please check GEMINI_MODEL in .env.local.";
  }

  return "Something went wrong while generating study material. Please try again.";
}

function isAuthOrQuotaError(error) {
  const message = error?.message?.toLowerCase() || "";

  return (
    message.includes("api key") ||
    message.includes("permission") ||
    message.includes("quota") ||
    message.includes("429") ||
    error?.status === 401 ||
    error?.status === 403 ||
    error?.status === 429
  );
}

function cleanGeneratedNotes(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, "$1").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getToolPrompt(tool, content) {
  const sharedRules = `Rules:
- Keep the wording simple.
- Do not use Markdown formatting.
- Do not use symbols like #, *, or **.
- For lists, use simple numbering like 1., 2., 3.
- Make it useful for students.
- Do not mention that you are an AI model.`;

  if (tool === "question") {
    return `You are StudyAI, a helpful question solver for students.

Solve this question step by step:
${content}

Use this exact structure:
Question
Given Information
Step-by-Step Solution
Final Answer
Quick Tip

${sharedRules}`;
  }

  if (tool === "summary") {
    return `You are StudyAI, a helpful study summarizer for students.

Summarize this long study material:
${content}

Use this exact structure:
# Executive Summary
- A concise 3-5 line overview
## Key Points
- The most important ideas in clear bullets
## Important Definitions
- Term: short definition
## Important Formulas
- Formula name: formula and when to use it
- If there are no formulas, write: No important formulas found.
## Revision Tips
- What to revise first
- Memory shortcuts or patterns
## Exam Tips
- What examiners may ask
- Common mistakes to avoid

Rules:
- Keep the summary concise but useful.
- Use clear headings and bullet points.
- Preserve important academic meaning.
- Do not add facts that are not supported by the input.
- Use simple student-friendly language.
- Do not mention that you are an AI model.`;
  }

  return `You are StudyAI, a helpful study assistant for students.

Create polished, beginner-friendly study notes for this topic:
${content}

Use this exact structure:
# Title
## Overview
- Short definition
- Why it matters
## Key Concepts
- Concept name: short explanation
- Concept name: short explanation
## Important Details
- Clear bullet point
- Clear bullet point
## Example
- Simple real-world or exam-style example
## Revision Tips
- Quick memory tip
- What to revise first
## Practice Questions
1. Question
2. Question

Rules:
- Keep the wording simple.
- Use clear headings and bullet points.
- Keep explanations short but useful.
- Make it useful for students.
- Do not mention that you are an AI model.`;
}

async function generateNotesWithFallback(ai, prompt) {
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

      const notes = cleanGeneratedNotes(response.text || "");

      if (notes) {
        return { notes, model };
      }
    } catch (error) {
      lastError = error;

      if (isAuthOrQuotaError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No Gemini model generated notes.");
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

    const { topic, tool } = await request.json();
    const cleanTopic = typeof topic === "string" ? topic.trim() : "";
    const selectedTool = ["notes", "question", "summary"].includes(tool)
      ? tool
      : "notes";

    if (!cleanTopic) {
      return Response.json(
        { error: "Please enter something first." },
        { status: 400 }
      );
    }

    const maxInputLength = selectedTool === "summary" ? 12000 : 3000;

    if (cleanTopic.length > maxInputLength) {
      return Response.json(
        { error: `Please keep your input under ${maxInputLength} characters.` },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error:
            "Gemini API key is missing. Add GEMINI_API_KEY in .env.local and restart the server.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = getToolPrompt(selectedTool, cleanTopic);

    const result = await generateNotesWithFallback(ai, prompt);

    if (!result.notes) {
      return Response.json(
        { error: "No notes were generated. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ notes: result.notes, model: result.model });
  } catch (error) {
    return Response.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
