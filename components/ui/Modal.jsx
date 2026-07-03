import { X } from "lucide-react";

export default function Modal({ title, children, onClose, labelledBy = "modal-title" }) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm studyai-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="mx-auto flex min-h-full items-start justify-center sm:items-center">
        <div className="max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-card studyai-scale-in">
          <div className="flex items-start justify-between gap-4 border-b border-border p-5 dark:border-border">
            <h2 id={labelledBy} className="text-xl font-bold text-text">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-text study-focus"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-5 study-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
