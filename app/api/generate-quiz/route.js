import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const allowedDifficulties = ["easy", "medium", "hard"];
const allowedQuestionCounts = [5, 10, 15];

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
      error: "Please log in to generate quizzes.",
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

  return "Could not generate a quiz right now. Please try again.";
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

function normalizeOption(value, fallback) {
  return String(value || fallback || "").trim();
}

function normalizeCorrectAnswer(question, options) {
  const answer = String(question.correct_answer || question.answer || "").trim();
  const letterMap = {
    a: options[0],
    b: options[1],
    c: options[2],
    d: options[3],
  };
  const letterAnswer = letterMap[answer.toLowerCase().replace(/[^a-d]/g, "")];

  if (letterAnswer) {
    return letterAnswer;
  }

  return options.find((option) => option.toLowerCase() === answer.toLowerCase()) || options[0];
}

function normalizeQuiz(rawQuiz, { topic, difficulty, totalQuestions }) {
  const questions = Array.isArray(rawQuiz?.questions) ? rawQuiz.questions : [];
  const normalizedQuestions = questions
    .map((question) => {
      const rawOptions = Array.isArray(question.options) ? question.options : [];
      const options = [
        normalizeOption(rawOptions[0], "Option A"),
        normalizeOption(rawOptions[1], "Option B"),
        normalizeOption(rawOptions[2], "Option C"),
        normalizeOption(rawOptions[3], "Option D"),
      ];
      const correctAnswer = normalizeCorrectAnswer(question, options);
      const questionText = String(question.question || "").trim();

      if (!questionText || !correctAnswer) {
        return null;
      }

      return {
        type: "mcq",
        question: questionText,
        options,
        answer: correctAnswer,
        correct_answer: correctAnswer,
        explanation: String(question.explanation || "").trim() || "Review the study material to understand why this answer is correct.",
      };
    })
    .filter(Boolean)
    .slice(0, totalQuestions);

  if (normalizedQuestions.length > 0) {
    return {
      title: rawQuiz?.title || `Quiz: ${topic}`,
      topic,
      difficulty,
      total_questions: normalizedQuestions.length,
      questions: normalizedQuestions,
    };
  }

  return buildFallbackQuiz({ topic, content: topic, difficulty, totalQuestions });
}

function buildFallbackQuiz({ topic, content, difficulty, totalQuestions }) {
  const sentences = String(content || topic || "")
    .replace(/\n/g, " ")
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
  const mainFact = sentences[0] || `The main topic is ${topic}.`;

  return {
    title: `Quiz: ${topic}`,
    topic,
    difficulty,
    total_questions: Math.min(totalQuestions, 5),
    questions: Array.from({ length: Math.min(totalQuestions, 5) }, (_, index) => ({
      type: "mcq",
      question: `Which statement best matches ${topic}?`,
      options: [
        mainFact,
        "It is unrelated to the study material.",
        "It is only a random date.",
        "It is only a person's name.",
      ],
      answer: mainFact,
      correct_answer: mainFact,
      explanation: "This answer is based on the provided study material.",
      id: `fallback-${index + 1}`,
    })),
  };
}

function buildQuizPrompt({ topic, content, difficulty, totalQuestions }) {
  return `Create a high-quality multiple-choice quiz for students.

Return only valid JSON. Do not use Markdown. Do not wrap the JSON in code fences.

JSON shape:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "options": ["A option", "B option", "C option", "D option"],
      "correct_answer": "Exact correct option text",
      "explanation": "Short explanation"
    }
  ]
}

Rules:
- Create exactly ${totalQuestions} questions.
- Difficulty: ${difficulty}.
- Every question must have exactly four options.
- Only one option may be correct.
- The correct_answer must exactly match one option text.
- Add a short explanation for every question.
- Base questions on the provided topic or notes.
- Avoid trick wording and ambiguous answers.
- Keep the wording student-friendly.

Topic: ${topic}

Study material:
${content.slice(0, 9000)}`;
}

async function generateQuiz(ai, prompt) {
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

  throw lastError || new Error("No model generated quiz JSON.");
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
    const cleanTopic =
      typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim()
        : cleanTitle || "Study Quiz";
    const cleanContent =
      typeof body.content === "string" && body.content.trim()
        ? body.content.trim()
        : cleanTopic;
    const difficulty = allowedDifficulties.includes(body.difficulty)
      ? body.difficulty
      : "medium";
    const totalQuestions = allowedQuestionCounts.includes(Number(body.totalQuestions))
      ? Number(body.totalQuestions)
      : allowedQuestionCounts.includes(Number(body.total_questions))
        ? Number(body.total_questions)
        : 5;

    if (!cleanContent) {
      return Response.json({ error: "Topic or notes are required." }, { status: 400 });
    }

    if (cleanContent.length > 12000) {
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

    const prompt = buildQuizPrompt({
      topic: cleanTopic,
      content: cleanContent,
      difficulty,
      totalQuestions,
    });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let rawQuiz;

    try {
      rawQuiz = await generateQuiz(ai, prompt);
    } catch (_error) {
      rawQuiz = buildFallbackQuiz({
        topic: cleanTopic,
        content: cleanContent,
        difficulty,
        totalQuestions,
      });
    }

    return Response.json({
      quiz: normalizeQuiz(rawQuiz, {
        topic: cleanTopic,
        difficulty,
        totalQuestions,
      }),
    });
  } catch (error) {
    return Response.json({ error: getGeminiErrorMessage(error) }, { status: 500 });
  }
}
