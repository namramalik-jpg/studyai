import DashboardShell from "@/components/DashboardShell";
import StudyPlanner from "@/components/StudyPlanner";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Study Planner",
  description: "Create deadlines, set priorities, and track study tasks in StudyAI.",
  path: "/planner",
});

export default function PlannerPage() {
  return (
    <DashboardShell
      eyebrow="Study Planner"
      title="Plan your study tasks"
      description="Create deadlines, set priorities, and track what is upcoming, overdue, or complete."
    >
      <StudyPlanner />
    </DashboardShell>
  );
}
