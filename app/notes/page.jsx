import DashboardShell from "@/components/DashboardShell";
import SavedNotesPageClient from "@/components/SavedNotesPageClient";

export const metadata = {
  title: "Saved Notes - StudyAI",
  description: "Search, filter, favorite, and manage saved StudyAI notes, summaries, quizzes, and flashcards.",
};

export default function NotesPage() {
  return (
    <DashboardShell
      eyebrow="Saved Library"
      title="Saved Notes"
      description="Search, filter, favorite, and manage your saved notes, summaries, quizzes, and flashcards in one clean workspace."
    >
      <SavedNotesPageClient />
    </DashboardShell>
  );
}
