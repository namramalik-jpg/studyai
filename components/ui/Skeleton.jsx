export function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "", children }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-card/80 shadow-sm ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
