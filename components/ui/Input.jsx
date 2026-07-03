import { cx } from "./Surface";

export default function Input({ className = "", icon: Icon, ...props }) {
  return (
    <span className="relative block">
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      )}
      <input
        className={cx(
          "min-h-11 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-text outline-none transition placeholder:text-muted",
          "focus:border-primary focus:ring-4 focus:ring-primary/15",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15",
          Icon && "pl-10",
          className
        )}
        {...props}
      />
    </span>
  );
}
