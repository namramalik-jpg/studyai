import AIFlashcardsGenerator from "@/components/AIFlashcardsGenerator";
import DashboardShell from "@/components/DashboardShell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Flashcards",
  description: "Generate interactive Gemini-powered flashcards from any topic or notes.",
  path: "/flashcards",
});

export default function FlashcardsPage() {
  return (
    <DashboardShell
      eyebrow="Flashcards"
      title="AI Flashcards Generator"
      description="Create interactive study flashcards from any topic or pasted notes, flip through the deck, and mark each card by difficulty."
    >
      <AIFlashcardsGenerator />
    </DashboardShell>
  );
}
