const DEFAULT_SITE_URL = "https://study-ai.mumar.dev";

function normalizeSiteUrl(url) {
  const cleanedUrl = String(url || DEFAULT_SITE_URL)
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/g, "");

  try {
    return new URL(cleanedUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteName = "StudyAI";
export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const defaultTitle =
  "StudyAI - AI Study Notes, Summaries, Quizzes & Flashcards";
export const defaultDescription =
  "Turn any topic into clear AI notes, concise summaries, practice quizzes, flashcards, and solved questions with StudyAI.";

export const seoKeywords = [
  "StudyAI",
  "AI study tool",
  "AI notes generator",
  "AI quiz generator",
  "AI summary generator",
  "AI flashcards",
  "student study app",
  "exam revision AI",
  "question solver",
];

export const noIndexRobots = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export function buildNoIndexMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: noIndexRobots,
  };
}

export function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
