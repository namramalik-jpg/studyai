"use client";

import {
  BrainCircuit,
  Check,
  Download,
  Eye,
  Layers,
  LoaderCircle,
  Pencil,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function NotesCard({
  itemId,
  title,
  content,
  tags = [],
  isPinned = false,
  createdAt,
  updatedAt,
  isOpen,
  onToggle,
  onDelete,
  canEdit = false,
  canPin = false,
  canExportPdf = false,
  canGenerateQuiz = false,
  canGenerateFlashcards = false,
  isEditing = false,
  editTitle = "",
  editContent = "",
  editTags = "",
  isUpdating = false,
  isDeleting = false,
  isPinning = false,
  isExportingPdf = false,
  isGeneratingQuiz = false,
  isGeneratingFlashcards = false,
  onStartEdit,
  onCancelEdit,
  onEditTitleChange,
  onEditContentChange,
  onEditTagsChange,
  onSaveEdit,
  onTogglePin,
  onDownloadPdf,
  onGenerateQuiz,
  onGenerateFlashcards,
}) {
  const noteTags = Array.isArray(tags) ? tags : [];
  const updatedAtTime = updatedAt ? new Date(updatedAt).getTime() : null;
  const createdAtTime = createdAt ? new Date(createdAt).getTime() : null;
  const wasUpdated =
    updatedAtTime && createdAtTime && Math.abs(updatedAtTime - createdAtTime) > 1000;

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-border bg-card p-4 shadow-card transition dark:border-border dark:bg-card sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveEdit?.();
          }}
          className="grid gap-4"
        >
          <div>
            <label
              htmlFor={`edit-title-${itemId}`}
              className="text-sm font-bold text-text dark:text-text"
            >
              Title
            </label>
            <Input
              id={`edit-title-${itemId}`}
              value={editTitle}
              onChange={(event) => onEditTitleChange?.(event.target.value)}
              disabled={isUpdating}
              className="mt-2"
              placeholder="Note title"
            />
          </div>

          <div>
            <label
              htmlFor={`edit-content-${itemId}`}
              className="text-sm font-bold text-text dark:text-text"
            >
              Content
            </label>
            <textarea
              id={`edit-content-${itemId}`}
              value={editContent}
              onChange={(event) => onEditContentChange?.(event.target.value)}
              disabled={isUpdating}
              rows={8}
              className="mt-2 min-h-40 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:border-border dark:bg-sidebar dark:text-text"
              placeholder="Note content"
            />
          </div>

          {canPin && (
            <div>
              <label
                htmlFor={`edit-tags-${itemId}`}
                className="text-sm font-bold text-text dark:text-text"
              >
                Tags
              </label>
              <Input
                id={`edit-tags-${itemId}`}
                value={editTags}
                onChange={(event) => onEditTagsChange?.(event.target.value)}
                disabled={isUpdating}
                className="mt-2"
                placeholder="biology, exam, chapter-1"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={onCancelEdit}
              disabled={isUpdating}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {isUpdating ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card dark:hover:bg-card sm:p-5 ${
        isPinned
          ? "border-primary/60 bg-primary/10 dark:border-primary/40 dark:bg-primary/10"
          : "border-border bg-background dark:border-border dark:bg-sidebar"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                Pinned
              </span>
            )}
            <h3 className="break-words text-lg font-bold tracking-normal text-text [overflow-wrap:anywhere] dark:text-text">
              {title}
            </h3>
          </div>

          <p className="mt-2 break-words text-xs font-semibold leading-5 text-muted dark:text-muted">
            Created {new Date(createdAt).toLocaleString()}
            {wasUpdated ? ` - Updated ${new Date(updatedAt).toLocaleString()}` : ""}
          </p>

          {noteTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {noteTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-primary-hover shadow-sm dark:border-border dark:bg-card dark:text-primary"
                >
                  <Tags className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="break-words [overflow-wrap:anywhere]">{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {canPin && (
            <button
              type="button"
              onClick={onTogglePin}
              disabled={isPinning}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
                isPinned
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-card text-primary-hover hover:bg-primary hover:text-white dark:bg-white/10 dark:text-primary"
              }`}
              aria-label={isPinned ? "Unpin note" : "Pin note"}
            >
              {isPinning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Star
                  className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
              )}
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-white dark:bg-white/10 dark:text-primary"
              aria-label="Edit note"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {canGenerateQuiz && (
            <button
              type="button"
              onClick={onGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:text-primary"
              aria-label="Generate quiz"
            >
              {isGeneratingQuiz ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <BrainCircuit className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          {canGenerateFlashcards && (
            <button
              type="button"
              onClick={onGenerateFlashcards}
              disabled={isGeneratingFlashcards}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:text-primary"
              aria-label="Generate flashcards"
            >
              {isGeneratingFlashcards ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Layers className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-white dark:bg-white/10 dark:text-primary"
            aria-label="View item"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          {canExportPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-hover shadow-sm transition hover:-translate-y-0.5 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:text-primary"
              aria-label="Download note PDF"
            >
              {isExportingPdf ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/10 dark:text-red-200"
            aria-label="Delete item"
          >
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-5 whitespace-pre-line break-words rounded-2xl border border-border bg-card p-4 text-sm leading-7 text-text [overflow-wrap:anywhere] dark:border-border dark:bg-card dark:text-text">
          {content}
        </div>
      )}
    </article>
  );
}
