"use client";

import { memo } from "react";
import {
  Copy,
  Download,
  Eye,
  Link2,
  LoaderCircle,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import Button from "./ui/Button";

const actionButtonClass =
  "min-w-[6.25rem] flex-1 whitespace-nowrap break-normal px-3 [overflow-wrap:normal]";

function cleanPreview(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function SavedNoteCard({
  item,
  isDeleting = false,
  isFavoriting = false,
  onOpen,
  onCopy,
  onEditTitle,
  onToggleFavorite,
  onDownloadPdf,
  onDelete,
  onShare,
}) {
  const Icon = item.icon;
  const preview = cleanPreview(item.preview);

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border bg-card p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-glow dark:bg-card/85 dark:shadow-card-dark sm:p-5">
      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="min-w-0 flex-1 rounded-2xl text-left outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={`Open ${item.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.badgeClass}`}>
              {item.featureLabel}
            </span>
          </div>

          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition ${
              item.isFavorite
                ? "border-amber-200 bg-amber-100 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200"
                : "border-border bg-surface text-muted"
            }`}
            aria-hidden="true"
          >
            <Star className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
          </span>
        </div>

        <h3 className="mt-5 line-clamp-2 break-words text-lg font-black tracking-tight text-text">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-muted">
          {preview}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
          <span>Saved {item.savedDate}</span>
          {item.createdDate !== item.savedDate && (
            <>
              <span aria-hidden="true">-</span>
              <span>Created {item.createdDate}</span>
            </>
          )}
        </div>
      </button>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onOpen?.(item)}
          className={actionButtonClass}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Open
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onCopy?.(item)}
          className={actionButtonClass}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEditTitle?.(item)}
          className={actionButtonClass}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
        <Button
          type="button"
          variant={item.isFavorite ? "primary" : "secondary"}
          size="sm"
          onClick={() => onToggleFavorite?.(item)}
          disabled={isFavoriting}
          className={actionButtonClass}
        >
          {isFavoriting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Star
              className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`}
              aria-hidden="true"
            />
          )}
          {item.isFavorite ? "Saved" : "Fav"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onDownloadPdf?.(item)}
          className={actionButtonClass}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          PDF
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onShare?.(item)}
          className={actionButtonClass}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Share
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onDelete?.(item)}
          disabled={isDeleting}
          className="min-w-[8rem] flex-[2_1_12rem] whitespace-nowrap break-normal px-3 [overflow-wrap:normal]"
        >
          {isDeleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          Delete
        </Button>
      </div>
    </article>
  );
}

export default memo(SavedNoteCard);
