import DashboardShell from "@/components/DashboardShell";
import SavedNotesPageClient from "@/components/SavedNotesPageClient";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Saved Notes",
  description: "Search, filter, favorite, and manage saved StudyAI notes, summaries, quizzes, and flashcards.",
  path: "/notes",
});

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
