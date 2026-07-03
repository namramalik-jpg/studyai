"use client";

import { memo } from "react";
import { CheckSquare, Copy, Eye, LoaderCircle, RefreshCcw, Save, Square, Trash2 } from "lucide-react";
import Button from "./ui/Button";

function HistoryCard({
  item,
  selected = false,
  isDeleting = false,
  isRegenerating = false,
  isSaving = false,
  onToggleSelect,
  onOpen,
  onCopy,
  onSave,
  onDelete,
  onRegenerate,
}) {
  const Icon = item.icon;

  return (
    <article className="group rounded-3xl border border-border bg-card p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-glow dark:bg-card/85 dark:shadow-card-dark sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <button
            type="button"
            onClick={() => onToggleSelect?.(item.id)}
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary/50 hover:text-primary"
            aria-label={selected ? "Unselect history item" : "Select history item"}
          >
            {selected ? (
              <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <Square className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpen?.(item)}
            className="min-w-0 rounded-2xl text-left outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20"
            aria-label={`Open ${item.featureLabel} history item`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.badgeClass}`}>
                {item.featureLabel}
              </span>
            </div>

            <h3 className="mt-4 line-clamp-2 break-words text-lg font-black tracking-tight text-text">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted">
              {item.preview}
            </p>
            <p className="mt-3 text-xs font-bold text-muted">
              {item.formattedDate}
            </p>
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpen?.(item)}>
            <Eye className="h-4 w-4" aria-hidden="true" />
            Open
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onCopy?.(item)}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Button type="button" size="sm" onClick={() => onSave?.(item)} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Save
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onRegenerate?.(item)} disabled={isRegenerating}>
            {isRegenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            )}
            Regenerate
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete?.(item)} disabled={isDeleting} className="sm:col-span-1">
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

export default memo(HistoryCard);
