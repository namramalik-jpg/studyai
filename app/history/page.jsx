import AIHistoryPageClient from "@/components/AIHistoryPageClient";
import DashboardShell from "@/components/DashboardShell";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "AI History",
  description: "Search, filter, reuse, and manage previous StudyAI generations.",
  path: "/history",
});

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
