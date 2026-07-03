import { memo } from "react";

function StatsCard({ label, value, description, icon: Icon, tourId }) {
  return (
    <article
      className="group rounded-2xl border border-border bg-card p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow dark:shadow-card-dark"
      data-onboarding-target={tourId || undefined}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-bold leading-5 text-muted">
            {label}
          </p>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-primary-hover">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="break-words text-4xl font-black tracking-normal text-text">
            {value || 0}
          </p>
          {description && (
            <p className="mt-2 text-xs font-semibold text-muted">
              {description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(StatsCard);
