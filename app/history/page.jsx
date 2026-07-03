import AIHistoryPageClient from "@/components/AIHistoryPageClient";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "AI History - StudyAI",
  description: "Search, filter, reuse, and manage previous StudyAI generations.",
};

export default function HistoryPage() {
  return (
    <DashboardShell
      eyebrow="AI History"
      title="AI History"
      description="View, search, filter, reuse, and manage your previous AI notes, summaries, quizzes, and flashcards."
    >
      <AIHistoryPageClient />
    </DashboardShell>
  );
}
