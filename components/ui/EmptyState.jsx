import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`studyai-fade-in rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center sm:px-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 break-words text-lg font-bold text-text">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md break-words text-sm leading-6 text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
