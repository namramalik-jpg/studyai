import { CalendarCheck, CheckCircle2, Clock, FileText, HelpCircle, Layers } from "lucide-react";
import StatsCard from "./StatsCard";

const statCards = [
  {
    key: "notes",
    label: "Total Notes",
    icon: FileText,
  },
  {
    key: "summaries",
    label: "Total Summaries",
    icon: Layers,
  },
  {
    key: "questions",
    label: "Total Questions",
    icon: HelpCircle,
  },
  {
    key: "totalTasks",
    label: "Total Tasks",
    icon: CalendarCheck,
  },
  {
    key: "completedTasks",
    label: "Completed Tasks",
    icon: CheckCircle2,
  },
  {
    key: "pendingTasks",
    label: "Pending Tasks",
    icon: Clock,
  },
];

export default function DashboardStats({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <StatsCard
            key={card.key}
            label={card.label}
            value={stats?.[card.key] || 0}
            icon={Icon}
          />
        );
      })}
    </div>
  );
}
