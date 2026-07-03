import { cx } from "./ui/Surface";

export default function SettingsCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section className={cx("study-glass p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 break-words text-2xl font-black tracking-tight text-text">
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
