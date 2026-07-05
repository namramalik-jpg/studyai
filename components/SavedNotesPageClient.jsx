"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  BrainCircuit,
  Check,
  Copy,
  Download,
  FileText,
  Layers,
  Link2,
  LoaderCircle,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/supabase";
import SavedNoteCard from "./SavedNoteCard";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Input from "./ui/Input";
import { SkeletonBlock, SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";

const filters = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "summary", label: "Summary" },
  { key: "quiz", label: "Quiz" },
  { key: "flashcards", label: "Flashcards" },
];

const featureStyles = {
  notes: {
    label: "Notes",
    icon: FileText,
    badgeClass: "bg-primary/10 text-primary",
    iconClass: "bg-primary text-white",
  },
  summary: {
    label: "Summary",
    icon: Layers,
    badgeClass: "bg-success/10 text-success",
    iconClass: "bg-success text-white",
  },
  quiz: {
    label: "Quiz",
    icon: BookOpenCheck,
    badgeClass: "bg-warning/10 text-warning",
    iconClass: "bg-warning text-white",
  },
  flashcards: {
    label: "Flashcards",
    icon: BrainCircuit,
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    iconClass: "bg-violet-600 text-white",
  },
};

function makeFavoriteKey(type, id) {
  return `${type}:${id}`;
}

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function cleanPreview(value, limit = 150) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function stringifyContent(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
}

function getQuizContent(quizData) {
  const data = quizData || {};
  const questions = Array.isArray(data)
    ? data
    : Array.isArray(data.questions)
      ? data.questions
      : [];

  if (questions.length === 0) return stringifyContent(data);

  return questions
    .map((question, index) => {
      const options = Array.isArray(question.options)
        ? question.options
        : question.options && typeof question.options === "object"
          ? Object.entries(question.options).map(([key, value]) => `${key}. ${value}`)
          : [];
      const correctAnswer =
        question.correct_answer ||
        question.correctAnswer ||
        question.answer ||
        "Not provided";

      return [
        `Question ${index + 1}: ${question.question || question.prompt || "Untitled question"}`,
        ...options.map((option, optionIndex) =>
          /^[A-D][.)]/i.test(String(option))
            ? String(option)
            : `${String.fromCharCode(65 + optionIndex)}. ${option}`
        ),
        `Correct Answer: ${correctAnswer}`,
        question.explanation ? `Explanation: ${question.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function getFlashcardsContent(flashcardsJson) {
  const data = flashcardsJson || {};
  const cards = Array.isArray(data)
    ? data
    : Array.isArray(data.cards)
      ? data.cards
      : Array.isArray(data.flashcards)
        ? data.flashcards
        : [];

  if (cards.length === 0) return stringifyContent(data);

  return cards
    .map((card, index) => {
      const front =
        card.front ||
        card.front_text ||
        card.question ||
        card.concept ||
        "Untitled card";
      const back =
        card.back ||
        card.back_text ||
        card.answer ||
        card.explanation ||
        "No answer provided";

      return `Card ${index + 1}\nFront: ${front}\nBack: ${back}`;
    })
    .join("\n\n");
}

function normalizeItem(row, type, favoriteId = "") {
  const style = featureStyles[type] || featureStyles.notes;
  let title = "Untitled saved item";
  let prompt = "";
  let content = "";

  if (type === "notes") {
    title = row.title || "Untitled note";
    prompt = row.prompt || "";
    content = row.generated_notes || row.content || "";
  }

  if (type === "summary") {
    title = row.topic || "Untitled summary";
    prompt = row.original_text || "";
    content = row.generated_summary || row.content || "";
  }

  if (type === "quiz") {
    title = row.topic || "Saved quiz";
    prompt = row.topic || "";
    content = getQuizContent(row.quiz_data);
  }

  if (type === "flashcards") {
    title = row.topic || "Flashcard deck";
    prompt = row.topic || "";
    content = getFlashcardsContent(row.flashcards_json);
  }

  return {
    id: `${type}:${row.id}`,
    sourceId: row.id,
    sourceType: type,
    sourceTable:
      type === "summary"
        ? "summaries"
        : type === "quiz"
          ? "quiz_history"
          : type === "flashcards"
            ? "flashcard_decks"
            : "notes",
    title,
    prompt,
    content,
    preview: cleanPreview(content || prompt, 150) || "No preview available.",
    createdAt: row.created_at,
    savedAt: row.updated_at || row.created_at,
    createdDate: formatDate(row.created_at),
    savedDate: formatDate(row.updated_at || row.created_at),
    favoriteId,
    isFavorite: Boolean(favoriteId),
    raw: row,
    featureLabel: style.label,
    icon: style.icon,
    badgeClass: style.badgeClass,
    iconClass: style.iconClass,
  };
}

function SavedNotesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading saved notes">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <SkeletonCard key={item} className="p-5">
          <div className="flex justify-between gap-3">
            <SkeletonBlock className="h-11 w-11 rounded-2xl" />
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          </div>
          <SkeletonBlock className="mt-5 h-6 w-3/4 rounded-full" />
          <SkeletonBlock className="mt-4 h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-5/6 rounded-full" />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <SkeletonBlock className="h-10 rounded-xl" />
            <SkeletonBlock className="h-10 rounded-xl" />
            <SkeletonBlock className="h-10 rounded-xl" />
            <SkeletonBlock className="h-10 rounded-xl" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

function ConfirmationModal({ title, description, isWorking, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="saved-confirm-title">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="saved-confirm-title" className="text-xl font-black text-text">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isWorking}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isWorking}>
            {isWorking ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function canEditSavedContent(item) {
  return item?.sourceType === "notes" || item?.sourceType === "summary";
}

function isMissingColumnError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("column") ||
    message.includes("does not exist")
  );
}

function EditItemModal({
  item,
  titleValue,
  contentValue,
  isWorking,
  onTitleChange,
  onContentChange,
  onCancel,
  onSave,
}) {
  if (!item) return null;

  const canEditContent = canEditSavedContent(item);

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="saved-edit-title">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.();
        }}
        className="w-full max-w-3xl rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card"
      >
        <h2 id="saved-edit-title" className="text-xl font-black text-text">
          Edit saved item
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {canEditContent
            ? `Update this ${item.featureLabel.toLowerCase()}'s title and content.`
            : `Rename this ${item.featureLabel.toLowerCase()}. Structured quiz and flashcard content can be regenerated from its page.`}
        </p>
        <Input
          value={titleValue}
          onChange={(event) => onTitleChange?.(event.target.value)}
          disabled={isWorking}
          className="mt-5"
          placeholder="Saved item title"
          aria-label="Saved item title"
        />
        {canEditContent && (
          <textarea
            value={contentValue}
            onChange={(event) => onContentChange?.(event.target.value)}
            disabled={isWorking}
            rows={12}
            className="mt-4 min-h-64 w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sidebar"
            placeholder="Edit saved content..."
            aria-label="Saved item content"
          />
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isWorking}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="submit" disabled={isWorking}>
            {isWorking ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

function DetailModal({ item, onClose, onCopy, onEditTitle, onFavorite, onDownloadPdf, onShare, onDelete, isFavoriting }) {
  if (!item) return null;

  const Icon = item.icon;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="saved-detail-title">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card dark:bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.badgeClass}`}>
                {item.featureLabel}
              </span>
              {item.isFavorite && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  Favorite
                </span>
              )}
            </div>
            <h2 id="saved-detail-title" className="mt-4 break-words text-2xl font-black tracking-tight text-text">
              {item.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              Created {item.createdDate} - Saved {item.savedDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary/50 hover:text-primary"
            aria-label="Close saved note details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-15rem)] overflow-y-auto p-5 study-scrollbar sm:max-h-[66vh]">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                Original Prompt
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-text [overflow-wrap:anywhere]">
                {item.prompt || "No original prompt was saved for this item."}
              </p>
            </section>
            <section className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                Full Content
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-text [overflow-wrap:anywhere]">
                {item.content || "No content available."}
              </p>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onCopy(item)}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Button type="button" variant="secondary" onClick={() => onEditTitle(item)}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button type="button" variant={item.isFavorite ? "primary" : "secondary"} onClick={() => onFavorite(item)} disabled={isFavoriting}>
            {isFavoriting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Star className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} aria-hidden="true" />
            )}
            {item.isFavorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => onDownloadPdf(item)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            PDF
          </Button>
          <Button type="button" variant="secondary" onClick={() => onShare(item)}>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Share
          </Button>
          <Button type="button" variant="danger" onClick={() => onDelete(item)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SavedNotesPageClient() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [activeItem, setActiveItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [favoritingId, setFavoritingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return items
      .filter((item) => filter === "all" || item.sourceType === filter)
      .filter((item) => {
        if (!cleanQuery) return true;

        return [item.title, item.prompt, item.content, item.featureLabel]
          .join(" ")
          .toLowerCase()
          .includes(cleanQuery);
      })
      .sort((first, second) => {
        if (sortOrder === "alphabetical") {
          return first.title.localeCompare(second.title);
        }

        const firstTime = new Date(first.savedAt).getTime();
        const secondTime = new Date(second.savedAt).getTime();

        return sortOrder === "oldest" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [filter, items, query, sortOrder]);

  useEffect(() => {
    loadSavedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setActiveItem(null);
        setEditingItem(null);
        setDeleteTarget(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function getSessionUser() {
    const { supabase, user, error: userError } = await getCurrentUser();

    if (userError) throw userError;
    if (!user) throw new Error("Please log in to view saved notes.");

    return { supabase, user };
  }

  async function fetchRows(supabase, table, select, userId) {
    const { data, error: loadError } = await supabase
      .from(table)
      .select(select)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (loadError) throw loadError;

    return data || [];
  }

  async function loadSavedItems() {
    setIsLoading(true);
    setError("");

    try {
      const { supabase, user } = await getSessionUser();
      const [notes, summaries, quizzes, flashcardDecks, favorites] = await Promise.all([
        fetchRows(
          supabase,
          "notes",
          "id,user_id,title,prompt,generated_notes,content,is_pinned,created_at,updated_at",
          user.id
        ),
        fetchRows(
          supabase,
          "summaries",
          "id,user_id,topic,original_text,generated_summary,content,created_at",
          user.id
        ),
        fetchRows(
          supabase,
          "quiz_history",
          "id,user_id,topic,difficulty,total_questions,score,quiz_data,created_at",
          user.id
        ),
        fetchRows(
          supabase,
          "flashcard_decks",
          "id,user_id,topic,flashcards_json,total_cards,created_at",
          user.id
        ),
        fetchRows(
          supabase,
          "favorites",
          "id,user_id,item_type,item_id,title,created_at",
          user.id
        ),
      ]);

      const favoritesByKey = new Map(
        favorites.map((favorite) => [
          makeFavoriteKey(favorite.item_type, favorite.item_id),
          favorite.id,
        ])
      );

      setItems([
        ...notes.map((row) =>
          normalizeItem(row, "notes", favoritesByKey.get(makeFavoriteKey("notes", row.id)))
        ),
        ...summaries.map((row) =>
          normalizeItem(row, "summary", favoritesByKey.get(makeFavoriteKey("summary", row.id)))
        ),
        ...quizzes.map((row) =>
          normalizeItem(row, "quiz", favoritesByKey.get(makeFavoriteKey("quiz", row.id)))
        ),
        ...flashcardDecks.map((row) =>
          normalizeItem(
            row,
            "flashcards",
            favoritesByKey.get(makeFavoriteKey("flashcards", row.id))
          )
        ),
      ]);
    } catch (loadError) {
      setError(loadError.message || "Could not load saved notes.");
    } finally {
      setIsLoading(false);
    }
  }

  const updateItemInState = useCallback((itemId, updates) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
    setActiveItem((currentItem) =>
      currentItem?.id === itemId ? { ...currentItem, ...updates } : currentItem
    );
  }, []);

  const copyItem = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(
        `${item.title}\n\nPrompt:\n${item.prompt || "No prompt saved."}\n\nContent:\n${item.content}`
      );
      setMessage("Saved content copied.");
    } catch (_copyError) {
      setError("Copy failed. Please select the content and copy manually.");
    }
  }, []);

  const openEditTitle = useCallback((item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || "");
  }, []);

  function getTitleColumn(item) {
    if (item.sourceType === "notes") return "title";
    if (item.sourceType === "summary") return "topic";
    if (item.sourceType === "quiz") return "topic";
    if (item.sourceType === "flashcards") return "topic";

    return "title";
  }

  function getContentColumnUpdates(item, content) {
    if (item.sourceType === "notes") {
      return {
        full: { generated_notes: content, content },
        fallback: { content },
      };
    }

    if (item.sourceType === "summary") {
      return {
        full: { generated_summary: content, content },
        fallback: { content },
      };
    }

    return { full: {}, fallback: null };
  }

  async function updateSavedSourceItem(supabase, item, updates, fallbackUpdates) {
    const updateQuery = supabase
      .from(item.sourceTable)
      .update(updates)
      .eq("id", item.sourceId)
      .eq("user_id", item.userId);

    const { error: updateError } = await updateQuery;

    if (!updateError) return;

    if (!fallbackUpdates || !isMissingColumnError(updateError)) {
      throw updateError;
    }

    const fallbackResult = await supabase
      .from(item.sourceTable)
      .update(fallbackUpdates)
      .eq("id", item.sourceId)
      .eq("user_id", item.userId);

    if (fallbackResult.error) {
      throw fallbackResult.error;
    }
  }

  async function saveItemEdit() {
    if (!editingItem) return;

    const cleanTitle = editTitle.trim();
    const cleanContent = editContent.trim();
    const shouldEditContent = canEditSavedContent(editingItem);

    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }

    if (shouldEditContent && !cleanContent) {
      setError("Content is required.");
      return;
    }

    setEditingId(editingItem.id);
    setError("");
    setMessage("");

    try {
      const { supabase, user } = await getSessionUser();
      const contentUpdates = getContentColumnUpdates(editingItem, cleanContent);
      const savedAt = new Date().toISOString();
      const timestampUpdate =
        editingItem.sourceType === "notes" ? { updated_at: savedAt } : {};
      const updates = {
        [getTitleColumn(editingItem)]: cleanTitle,
        ...contentUpdates.full,
        ...timestampUpdate,
      };
      const fallbackUpdates = contentUpdates.fallback
        ? {
            [getTitleColumn(editingItem)]: cleanTitle,
            ...contentUpdates.fallback,
            ...timestampUpdate,
          }
        : null;

      await updateSavedSourceItem(supabase, { ...editingItem, userId: user.id }, updates, fallbackUpdates);

      updateItemInState(editingItem.id, {
        title: cleanTitle,
        ...(shouldEditContent
          ? {
              content: cleanContent,
              preview: cleanPreview(cleanContent || editingItem.prompt, 150) || "No preview available.",
            }
          : {}),
        ...(editingItem.sourceType === "notes"
          ? {
              savedAt,
              savedDate: formatDate(savedAt),
            }
          : {}),
      });
      setEditingItem(null);
      setEditTitle("");
      setEditContent("");
      setMessage(shouldEditContent ? "Saved item updated." : "Title updated.");
    } catch (updateError) {
      setError(updateError.message || "Could not update saved item.");
    } finally {
      setEditingId("");
    }
  }

  const toggleFavorite = useCallback(async (item) => {
    setFavoritingId(item.id);
    setError("");
    setMessage("");

    try {
      const { supabase, user } = await getSessionUser();

      if (item.isFavorite) {
        const deleteQuery = supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", item.sourceType)
          .eq("item_id", item.sourceId);

        const { error: deleteError } = await deleteQuery;

        if (deleteError) throw deleteError;

        updateItemInState(item.id, { isFavorite: false, favoriteId: "" });
        setMessage("Removed from favorites.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          item_type: item.sourceType,
          item_id: item.sourceId,
          title: item.title,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      updateItemInState(item.id, {
        isFavorite: true,
        favoriteId: data?.id || "favorite",
      });
      setMessage("Added to favorites.");
    } catch (favoriteError) {
      setError(favoriteError.message || "Could not update favorite.");
    } finally {
      setFavoritingId("");
    }
  }, [updateItemInState]);

  const downloadPdfPlaceholder = useCallback((item) => {
    setMessage(`PDF download for ${item.featureLabel.toLowerCase()} is ready as a frontend placeholder.`);
  }, []);

  const shareItem = useCallback(async (item) => {
    try {
      const link = `${window.location.origin}/notes?item=${encodeURIComponent(item.id)}`;
      await navigator.clipboard.writeText(link);
      setMessage("Share link copied. Public sharing can be connected later.");
    } catch (_shareError) {
      setError("Could not copy share link.");
    }
  }, []);

  const requestDelete = useCallback((item) => {
    setDeleteTarget(item);
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeletingId(deleteTarget.id);
    setError("");
    setMessage("");

    try {
      const { supabase, user } = await getSessionUser();
      const { error: deleteError } = await supabase
        .from(deleteTarget.sourceTable)
        .delete()
        .eq("id", deleteTarget.sourceId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", deleteTarget.sourceType)
        .eq("item_id", deleteTarget.sourceId);

      setItems((currentItems) => currentItems.filter((item) => item.id !== deleteTarget.id));
      setActiveItem((currentItem) =>
        currentItem?.id === deleteTarget.id ? null : currentItem
      );
      setDeleteTarget(null);
      setMessage("Saved item deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete saved item.");
    } finally {
      setIsDeleting(false);
      setDeletingId("");
    }
  }

  return (
    <>
      {activeItem && (
        <DetailModal
          item={activeItem}
          isFavoriting={favoritingId === activeItem.id}
          onClose={() => setActiveItem(null)}
          onCopy={copyItem}
          onEditTitle={openEditTitle}
          onFavorite={toggleFavorite}
          onDownloadPdf={downloadPdfPlaceholder}
          onShare={shareItem}
          onDelete={requestDelete}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          titleValue={editTitle}
          contentValue={editContent}
          isWorking={editingId === editingItem.id}
          onTitleChange={setEditTitle}
          onContentChange={setEditContent}
          onCancel={() => {
            setEditingItem(null);
            setEditTitle("");
            setEditContent("");
          }}
          onSave={saveItemEdit}
        />
      )}

      {deleteTarget && (
        <ConfirmationModal
          title="Delete saved item?"
          description={`This will permanently delete "${deleteTarget.title}" from your saved ${deleteTarget.featureLabel.toLowerCase()}.`}
          isWorking={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      <div className="grid gap-6">
        <Surface className="p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <Input
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved notes, summaries, quizzes, or flashcards..."
              aria-label="Search saved notes"
            />
            <label className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-xl border border-border bg-card py-2.5 pl-11 pr-9 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 lg:w-44"
                aria-label="Sort saved notes"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={loadSavedItems}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-black transition ${
                  filter === item.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Surface>

        <div className="grid gap-3">
          <Toast message={message} />
          <Toast message={error} type="error" />
        </div>

        {isLoading ? (
          <SavedNotesSkeleton />
        ) : error && items.length === 0 ? (
          <Surface className="p-5">
            <EmptyState
              icon={AlertTriangle}
              title="Could not load saved notes"
              description={error}
            />
            <div className="mt-5 flex justify-center">
              <Button type="button" onClick={loadSavedItems}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          </Surface>
        ) : filteredItems.length === 0 ? (
          <Surface className="p-5">
            <EmptyState
              icon={FileText}
              title={items.length === 0 ? "No saved notes yet." : "No matching saved notes"}
              description={
                items.length === 0
                  ? "No saved notes yet. Generate your first study content and save it here."
                  : "Try a different search, filter, or sort option."
              }
              action={
                items.length === 0 ? (
                  <Button as={Link} href="/ai-notes">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Generate AI Notes
                  </Button>
                ) : null
              }
            />
          </Surface>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <SavedNoteCard
                key={item.id}
                item={item}
                isDeleting={deletingId === item.id}
                isFavoriting={favoritingId === item.id}
                onOpen={setActiveItem}
                onCopy={copyItem}
                onEditTitle={openEditTitle}
                onToggleFavorite={toggleFavorite}
                onDownloadPdf={downloadPdfPlaceholder}
                onDelete={requestDelete}
                onShare={shareItem}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
