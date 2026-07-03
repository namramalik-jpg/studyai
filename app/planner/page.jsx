import DashboardShell from "@/components/DashboardShell";
import StudyPlanner from "@/components/StudyPlanner";

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
