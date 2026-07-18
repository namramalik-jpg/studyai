import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/admin",
        "/ai-notes",
        "/ai-quiz",
        "/ai-summary",
        "/api",
        "/chat",
        "/dashboard",
        "/flashcards",
        "/forgot-password",
        "/history",
        "/login",
        "/notes",
        "/planner",
        "/profile",
        "/questions",
        "/reset-password",
        "/settings",
        "/sign-in",
        "/sign-up",
        "/signup",
        "/summaries",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
