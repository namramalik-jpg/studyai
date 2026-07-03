"use client";

import { useId } from "react";

export default function SettingsToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}) {
  const descriptionId = useId();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-text">{label}</p>
        {description && (
          <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked
            ? "border-primary bg-primary"
            : "border-border bg-card"
        }`}
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={label}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition duration-200 ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
