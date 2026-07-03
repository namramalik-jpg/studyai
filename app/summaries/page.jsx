import DashboardShell from "@/components/DashboardShell";
import SummaryList from "@/components/SummaryList";

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
