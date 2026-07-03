import AIFlashcardsGenerator from "@/components/AIFlashcardsGenerator";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Flashcards - StudyAI",
  description: "Generate interactive Gemini-powered flashcards from any topic or notes.",
};

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
