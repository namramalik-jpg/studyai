import { Activity, BookOpenCheck, BrainCircuit, FileText, History, Layers } from "lucide-react";
import EmptyState from "./ui/EmptyState";
import Surface from "./ui/Surface";

const activityIcons = {
  notes: FileText,
  summary: Layers,
  quiz: BookOpenCheck,
  flashcards: BrainCircuit,
  history: History,
};

export default function ProfileRecentActivity({ activities = [] }) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Activity className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text">
            Recent activity
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Your latest StudyAI generations and saved study content.
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Generate notes, summaries, quizzes, or flashcards to see your timeline here."
          className="mt-5"
        />
      ) : (
        <div className="mt-5 grid gap-3">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || History;

            return (
              <article
                key={`${activity.type}-${activity.id}`}
                className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-black text-text">
                      {activity.title}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-primary">
                      {activity.label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-muted">
                    {activity.description}
                  </p>
                  <p className="mt-2 text-xs font-bold text-muted">
                    {activity.date}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Surface>
  );
}
