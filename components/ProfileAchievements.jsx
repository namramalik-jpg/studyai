import { BookOpen, Flame, Lock, Sparkles, Target, Trophy } from "lucide-react";
import Surface from "./ui/Surface";

const achievementIcons = {
  trophy: Trophy,
  book: BookOpen,
  target: Target,
  flame: Flame,
};

export default function ProfileAchievements({ achievements = [] }) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Achievements
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-text">
            Study milestones
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Unlock badges as you create, practice, and keep your study rhythm.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((achievement) => {
          const Icon = achievement.unlocked
            ? achievementIcons[achievement.icon] || Trophy
            : Lock;

          return (
            <article
              key={achievement.title}
              className={`rounded-2xl border p-4 transition duration-200 ${
                achievement.unlocked
                  ? "border-primary/25 bg-primary/10 shadow-sm hover:-translate-y-1 hover:border-primary/45"
                  : "border-border bg-surface opacity-65"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  achievement.unlocked
                    ? "bg-primary text-white"
                    : "bg-card text-muted"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-black text-text">
                {achievement.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {achievement.description}
              </p>
              <p
                className={`mt-3 text-xs font-black uppercase tracking-wide ${
                  achievement.unlocked ? "text-primary" : "text-muted"
                }`}
              >
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </p>
            </article>
          );
        })}
      </div>
    </Surface>
  );
}
