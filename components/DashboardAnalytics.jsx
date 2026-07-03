import {
  Activity,
  CalendarDays,
  FileText,
  HelpCircle,
  History,
  Layers,
  Sparkles,
  Star,
} from "lucide-react";
import StatsCard from "./StatsCard";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
import { SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";

const statCards = [
  {
    key: "notes",
    label: "Total Notes Generated",
    description: "Saved AI notes",
    icon: FileText,
    tourId: "ai-notes",
  },
  {
    key: "summaries",
    label: "Total Summaries Created",
    description: "Quick study summaries",
    icon: Layers,
    tourId: "quick-summary",
  },
  {
    key: "questions",
    label: "Total Questions Solved",
    description: "Step-by-step answers",
    icon: HelpCircle,
    tourId: "question-solver",
  },
  {
    key: "aiRequests",
    label: "Total AI Requests",
    description: "All tracked AI usage",
    icon: Sparkles,
  },
  {
    key: "favorites",
    label: "Favorites Count",
    description: "Saved favorites",
    icon: Star,
  },
];

const activityStyles = {
  note: {
    label: "Note",
    className: "bg-primary text-white",
  },
  summary: {
    label: "Summary",
    className: "bg-primary-hover text-white",
  },
  question: {
    label: "Question",
    className: "bg-sky-500 text-white",
  },
  ai: {
    label: "AI Request",
    className: "bg-success text-white",
  },
  favorite: {
    label: "Favorite",
    className: "bg-warning text-white",
  },
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getChartMax(items) {
  return Math.max(...items.map((item) => item.value), 1);
}

function AnalyticsChart({ title, description, items, icon: Icon }) {
  const maxValue = getChartMax(items);
  const hasData = items.some((item) => item.value > 0);

  return (
    <Surface>
      <SectionHeader
        eyebrow="Analytics"
        title={title}
        description={description}
        icon={Icon}
      />

      {!hasData ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Generate notes, summaries, or answers and this chart will start filling up."
          className="mt-5"
        />
      ) : (
        <div className="mt-6">
          <div
            className="flex h-56 items-end gap-2 rounded-2xl border border-border bg-surface px-3 pb-4 pt-6 sm:gap-3 sm:px-4"
            role="img"
            aria-label={`${title} bar chart`}
          >
            {items.map((item) => {
              const height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`;

              return (
                <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-bold text-muted">
                    {item.value}
                  </span>
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-xl bg-primary transition-all duration-500 hover:bg-primary-hover"
                      style={{ height }}
                      title={`${item.label}: ${item.value}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted">
            {items.map((item) => (
              <span key={item.label} className="truncate">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Surface>
  );
}

function MonthlyActivityChart({ items }) {
  const maxValue = getChartMax(items);
  const hasData = items.some((item) => item.value > 0);

  return (
    <Surface>
      <SectionHeader
        eyebrow="Monthly"
        title="Monthly Activity"
        description="StudyAI activity across the last six months."
        icon={CalendarDays}
      />

      {!hasData ? (
        <EmptyState
          icon={CalendarDays}
          title="No monthly data yet"
          description="Your monthly trend will appear after you create study content."
          className="mt-5"
        />
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((item) => {
            const width = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0)}%`;

            return (
              <div key={item.label} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <span className="text-text">{item.label}</span>
                  <span className="text-muted">{item.value}</span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-surface"
                  role="progressbar"
                  aria-label={`${item.label} activity`}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  aria-valuenow={item.value}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

function ActivityTimeline({ items }) {
  return (
    <Surface data-onboarding-target="history">
      <SectionHeader
        eyebrow="Recent Activity"
        title="Activity Timeline"
        description="Latest notes, summaries, questions, AI requests, and favorites."
        icon={History}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No recent activity"
          description="Your newest StudyAI activity will appear here."
          className="mt-5"
        />
      ) : (
        <div className="mt-6 grid gap-4">
          {items.map((item, index) => {
            const style = activityStyles[item.type] || activityStyles.ai;

            return (
              <article key={item.id} className="relative flex gap-4">
                {index !== items.length - 1 && (
                <span className="absolute left-5 top-11 h-[calc(100%+0.25rem)] w-px bg-border" />
                )}
                <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${style.className}`}>
                  {style.label.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        {style.label}
                      </p>
                      <h3 className="mt-1 line-clamp-2 break-words font-bold text-text">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs font-bold text-muted">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

export function DashboardAnalyticsSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <SkeletonCard
            key={item}
            className="h-36 rounded-2xl"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {[1, 2].map((item) => (
          <SkeletonCard
            key={item}
            className="h-80"
          />
        ))}
      </div>
      <SkeletonCard className="h-96" />
    </div>
  );
}

export default function DashboardAnalytics({ stats, weeklyActivity, monthlyActivity, recentActivity }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <StatsCard
            key={card.key}
            label={card.label}
            value={stats?.[card.key] || 0}
            description={card.description}
            icon={card.icon}
            tourId={card.tourId}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyticsChart
          title="Weekly Activity"
          description="Daily activity from your StudyAI workspace over the last seven days."
          items={weeklyActivity || []}
          icon={Activity}
        />
        <MonthlyActivityChart items={monthlyActivity || []} />
      </div>

      <ActivityTimeline items={recentActivity || []} />
    </div>
  );
}
