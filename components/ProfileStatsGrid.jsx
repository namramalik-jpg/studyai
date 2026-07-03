import {
  BookOpenCheck,
  BrainCircuit,
  Flame,
  FolderOpen,
  History,
  Layers,
  StickyNote,
} from "lucide-react";
import StatsCard from "./StatsCard";

const profileStats = [
  { key: "notes", label: "Total AI Notes Generated", icon: StickyNote },
  { key: "summaries", label: "Total Summaries", icon: Layers },
  { key: "quizzes", label: "Total Quizzes Completed", icon: BookOpenCheck },
  { key: "flashcardDecks", label: "Total Flashcard Decks", icon: BrainCircuit },
  { key: "savedNotes", label: "Saved Notes", icon: FolderOpen },
  { key: "studyStreak", label: "Study Streak", icon: Flame },
  { key: "aiRequests", label: "Total AI Requests", icon: History },
];

export default function ProfileStatsGrid({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {profileStats.map((item) => (
        <StatsCard
          key={item.key}
          label={item.label}
          value={stats?.[item.key] || 0}
          description={item.key === "studyStreak" ? "active days in a row" : undefined}
          icon={item.icon}
        />
      ))}
    </div>
  );
}
