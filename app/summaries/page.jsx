import DashboardShell from "@/components/DashboardShell";
import SummaryList from "@/components/SummaryList";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Saved Summaries",
  description: "Review saved StudyAI summaries.",
  path: "/summaries",
});

export default function SummariesPage() {
  return (
    <DashboardShell
      eyebrow="My Summaries"
      title="Saved summaries"
      description="Keep your quick revision summaries organized and easy to revisit."
    >
      <SummaryList />
    </DashboardShell>
  );
}
