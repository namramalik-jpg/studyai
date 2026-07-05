"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  BrainCircuit,
  Copy,
  FileText,
  History,
  Layers,
  LoaderCircle,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAiHistory } from "@/lib/aiHistory";
import { addStudyNotification } from "@/lib/notifications";
import { saveStudyItem } from "@/lib/saveStudyItem";
import { getCurrentUser } from "@/lib/supabase";
import HistoryCard from "./HistoryCard";
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

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFeatureType(feature) {
  const cleanFeature = String(feature || "").toLowerCase();

  if (cleanFeature.includes("summary")) return "summary";
  if (cleanFeature.includes("quiz")) return "quiz";
  if (cleanFeature.includes("question")) return "quiz";
  if (cleanFeature.includes("flash")) return "flashcards";
  if (cleanFeature.includes("note")) return "notes";

  return "notes";
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function getFlashcardsFromResponse(response) {
  const parsed = safeJsonParse(response);
  const cards = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.cards)
      ? parsed.cards
      : Array.isArray(parsed?.flashcards)
        ? parsed.flashcards
        : [];

  return cards;
}

function formatFlashcardsResponse(response) {
  const cards = getFlashcardsFromResponse(response);

  if (cards.length === 0) return String(response || "");

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

function formatQuizResponse(response) {
  const parsed = safeJsonParse(response);
  const questions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
      ? parsed.questions
      : [];

  if (questions.length === 0) return String(response || "");

  return questions
    .map((question, index) => {
      const options = Array.isArray(question.options) ? question.options : [];
      const answer =
        question.answer ||
        question.correct_answer ||
        question.correctAnswer ||
        "Not provided";

      return [
        `Question ${index + 1}: ${question.question || question.prompt || "Untitled question"}`,
        ...options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`),
        `Correct Answer: ${answer}`,
        question.explanation ? `Explanation: ${question.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatHistoryResponse(response, type) {
  if (type === "flashcards") return formatFlashcardsResponse(response);
  if (type === "quiz") return formatQuizResponse(response);

  return String(response || "");
}

function getTitleFromResponse(response, prompt, type) {
  const parsed = safeJsonParse(response);

  if (parsed?.title) return String(parsed.title).slice(0, 100);
  if (parsed?.topic) return String(parsed.topic).slice(0, 100);

  const firstLine = String(response || "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^(title|executive summary)\s*[:\-]\s*/i, "")
        .trim()
    )
    .find(Boolean);

  if (firstLine) return firstLine.slice(0, 100);

  const fallbackPrefix =
    type === "summary"
      ? "Summary"
      : type === "quiz"
        ? "Quiz"
        : type === "flashcards"
          ? "Flashcards"
          : "Notes";

  return `${fallbackPrefix}: ${String(prompt || "Untitled").slice(0, 80)}`;
}

function normalizeHistoryItem(item) {
  const type = getFeatureType(item.feature);
  const style = featureStyles[type] || featureStyles.notes;
  const title = getTitleFromResponse(item.response, item.prompt, type);
  const displayResponse = formatHistoryResponse(item.response, type);
  const preview = String(displayResponse || item.prompt || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return {
    ...item,
    type,
    title,
    displayResponse,
    preview: preview || "No preview available.",
    featureLabel: style.label,
    icon: style.icon,
    badgeClass: style.badgeClass,
    iconClass: style.iconClass,
    formattedDate: formatDate(item.created_at),
  };
}

function HistorySkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2, 3].map((item) => (
        <SkeletonCard key={item} className="p-5">
          <div className="flex gap-4">
            <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            <div className="w-full">
              <SkeletonBlock className="h-5 w-28 rounded-full" />
              <SkeletonBlock className="mt-4 h-6 w-2/3 rounded-full" />
              <SkeletonBlock className="mt-3 h-4 w-full rounded-full" />
              <SkeletonBlock className="mt-3 h-4 w-48 rounded-full" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

function ConfirmationModal({ title, description, confirmLabel, isWorking, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="history-confirm-title">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="history-confirm-title" className="text-xl font-black text-text">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {description}
            </p>
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
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HistoryDetailModal({ item, isSaving, isRegenerating, onClose, onCopy, onSave, onDelete, onRegenerate }) {
  if (!item) return null;

  const Icon = item.icon;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
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
            </div>
            <h2 id="history-detail-title" className="mt-4 break-words text-2xl font-black tracking-tight text-text">
              {item.title}
            </h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              {item.formattedDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary/50 hover:text-primary"
            aria-label="Close history details"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-15rem)] overflow-y-auto p-5 study-scrollbar sm:max-h-[66vh]">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                Original Prompt
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-text [overflow-wrap:anywhere]">
                {item.prompt}
              </p>
            </section>
            <section className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                Generated Content
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-text [overflow-wrap:anywhere]">
                {item.displayResponse || item.response}
              </p>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onCopy(item)}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
          <Button type="button" onClick={() => onSave(item)} disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={() => onRegenerate(item)} disabled={isRegenerating}>
            {isRegenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            )}
            Regenerate
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

export default function AIHistoryPageClient() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [regeneratingId, setRegeneratingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedItems = useMemo(
    () => items.map(normalizeHistoryItem),
    [items]
  );

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return normalizedItems
      .filter((item) => filter === "all" || item.type === filter)
      .filter((item) => {
        if (!cleanQuery) return true;

        return [item.title, item.prompt, item.response, item.feature]
          .join(" ")
          .toLowerCase()
          .includes(cleanQuery);
      })
      .sort((first, second) => {
        const firstTime = new Date(first.created_at).getTime();
        const secondTime = new Date(second.created_at).getTime();

        return sortOrder === "oldest" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [filter, normalizedItems, query, sortOrder]);

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
        setConfirmation(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getAuthenticatedSession() {
    const { supabase, user, error: userError } = await getCurrentUser();

    if (userError) throw userError;
    if (!user) throw new Error("Please log in to view AI history.");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    return {
      supabase,
      user,
      token: sessionData.session?.access_token || "",
    };
  }

  async function loadHistory() {
    setIsLoading(true);
    setError("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      const { data, error: historyError } = await supabase
        .from("ai_history")
        .select("id,user_id,feature,prompt,response,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      setItems(data || []);
      setSelectedIds([]);
    } catch (loadError) {
      setError(loadError.message || "Could not load AI history.");
    } finally {
      setIsLoading(false);
    }
  }

  const toggleSelect = useCallback((id) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id]
    );
  }, []);

  function selectAllVisible() {
    const visibleIds = filteredItems.map((item) => item.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : visibleIds);
  }

  const copyItem = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(
        `Prompt:\n${item.prompt}\n\nResponse:\n${item.displayResponse || item.response}`
      );
      setMessage("History item copied.");
    } catch (_copyError) {
      setError("Copy failed. Please select the content and copy manually.");
    }
  }, []);

  const saveItem = useCallback(async (item) => {
    setSavingId(item.id);
    setMessage("");
    setError("");

    try {
      const { supabase, user } = await getAuthenticatedSession();

      if (item.type === "notes") {
        await saveStudyItem(supabase, {
          type: "notes",
          title: item.title,
          prompt: item.prompt,
          content: item.displayResponse || item.response,
          tags: ["history"],
        });
      } else if (item.type === "summary") {
        await saveStudyItem(supabase, {
          type: "summaries",
          title: item.title,
          prompt: item.prompt,
          content: item.displayResponse || item.response,
        });
      } else if (item.type === "quiz") {
        const parsed = safeJsonParse(item.response) || { content: item.response };
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        await saveStudyItem(supabase, {
          type: "quiz_history",
          title: item.title,
          difficulty: parsed.difficulty || "medium",
          total_questions: questions.length || parsed.total_questions || 0,
          score: parsed.score ?? null,
          quiz_data: parsed,
        });
      } else if (item.type === "flashcards") {
        const parsedResponse = safeJsonParse(item.response);
        const cards = getFlashcardsFromResponse(item.response);
        const deckPayload = Array.isArray(parsedResponse)
          ? { cards: parsedResponse }
          : parsedResponse || { cards: [], content: item.response };
        await saveStudyItem(supabase, {
          type: "flashcard_decks",
          title: item.title,
          flashcards_json: deckPayload,
          total_cards: cards.length || Number(deckPayload.total_cards || 0),
        });
      }

      setMessage(`${item.featureLabel} saved successfully.`);
      addStudyNotification(user.id, {
        title: "History item saved",
        message: `${item.featureLabel} was saved from AI history.`,
        type: "success",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save this history item.");
    } finally {
      setSavingId("");
    }
  }, []);

  const regenerateItem = useCallback(async (item) => {
    setRegeneratingId(item.id);
    setMessage("");
    setError("");

    try {
      const { supabase, user, token } = await getAuthenticatedSession();

      if (!token) throw new Error("Your session expired. Please log in again.");

      let responseText = "";

      if (item.type === "notes" || item.type === "summary") {
        const response = await fetch("/api/generate-notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: item.prompt,
            tool: item.type === "summary" ? "summary" : "notes",
          }),
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error || "Could not regenerate content.");
        responseText = payload.notes;
      } else if (item.type === "quiz") {
        const response = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: item.title,
            content: item.prompt,
            difficulty: "medium",
            totalQuestions: 5,
          }),
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error || "Could not regenerate quiz.");
        responseText = JSON.stringify(payload.quiz, null, 2);
      } else if (item.type === "flashcards") {
        const response = await fetch("/api/generate-flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: item.title,
            content: item.prompt,
            totalCards: 10,
          }),
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error || "Could not regenerate flashcards.");
        responseText = JSON.stringify(payload.deck || { cards: payload.flashcards || [] }, null, 2);
      }

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: item.feature,
        prompt: item.prompt,
        response: responseText,
      });

      if (historyError) throw historyError;

      setMessage("Regenerated and added to history.");
      await loadHistory();
    } catch (regenerateError) {
      setError(regenerateError.message || "Could not regenerate this item.");
    } finally {
      setRegeneratingId("");
    }
  }, []);

  const requestDelete = useCallback((item) => {
    setConfirmation({
      type: "single",
      ids: [item.id],
      title: "Delete history item?",
      description: "This removes this AI history item from your account.",
      confirmLabel: "Delete",
    });
  }, []);

  function requestBulkDelete() {
    if (selectedIds.length === 0) return;

    setConfirmation({
      type: "bulk",
      ids: selectedIds,
      title: `Delete ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}?`,
      description: "This removes the selected AI history items from your account.",
      confirmLabel: "Delete selected",
    });
  }

  function requestClearAll() {
    setConfirmation({
      type: "all",
      ids: [],
      title: "Clear all AI history?",
      description: "This permanently removes every AI history item from your account.",
      confirmLabel: "Clear all",
    });
  }

  async function confirmDelete() {
    if (!confirmation) return;

    setIsDeleting(true);
    setDeletingId(confirmation.type === "single" ? confirmation.ids[0] : "");
    setMessage("");
    setError("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      let query = supabase.from("ai_history").delete().eq("user_id", user.id);

      if (confirmation.type !== "all") {
        query = query.in("id", confirmation.ids);
      }

      const { error: deleteError } = await query;

      if (deleteError) throw deleteError;

      const deletedIds = confirmation.ids;
      setItems((currentItems) =>
        confirmation.type === "all"
          ? []
          : currentItems.filter((item) => !deletedIds.includes(item.id))
      );
      setSelectedIds((currentIds) =>
        confirmation.type === "all"
          ? []
          : currentIds.filter((id) => !deletedIds.includes(id))
      );
      setActiveItem((currentItem) =>
        currentItem && (confirmation.type === "all" || deletedIds.includes(currentItem.id))
          ? null
          : currentItem
      );
      setConfirmation(null);
      setMessage(
        confirmation.type === "all"
          ? "All AI history cleared."
          : "History item deleted."
      );
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete history.");
    } finally {
      setIsDeleting(false);
      setDeletingId("");
    }
  }

  return (
    <>
      {activeItem && (
        <HistoryDetailModal
          item={activeItem}
          isSaving={savingId === activeItem.id}
          isRegenerating={regeneratingId === activeItem.id}
          onClose={() => setActiveItem(null)}
          onCopy={copyItem}
          onSave={saveItem}
          onDelete={requestDelete}
          onRegenerate={regenerateItem}
        />
      )}

      {confirmation && (
        <ConfirmationModal
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          isWorking={isDeleting}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmDelete}
        />
      )}

      <div className="grid gap-6">
        <Surface className="p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <Input
                icon={Search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, prompt, or generated content..."
                aria-label="Search AI history"
              />
              <label className="relative">
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="min-h-11 w-full appearance-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 lg:w-44"
                  aria-label="Sort AI history"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </label>
              <Button type="button" variant="secondary" onClick={loadHistory}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={selectAllVisible} disabled={filteredItems.length === 0}>
                {selectedIds.length > 0 ? "Clear selection" : "Select visible"}
              </Button>
              <Button type="button" variant="danger" onClick={requestBulkDelete} disabled={selectedIds.length === 0}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete selected
              </Button>
              <Button type="button" variant="danger" onClick={requestClearAll} disabled={items.length === 0}>
                Clear all
              </Button>
            </div>
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
          <HistorySkeleton />
        ) : error && items.length === 0 ? (
          <Surface className="p-5">
            <EmptyState
              icon={AlertTriangle}
              title="Could not load AI history"
              description={error}
            />
            <div className="mt-5 flex justify-center">
              <Button type="button" onClick={loadHistory}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          </Surface>
        ) : filteredItems.length === 0 ? (
          <Surface className="p-5">
            <EmptyState
              icon={History}
              title="No AI history yet"
              description="No AI history yet. Generate your first study content."
            />
          </Surface>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                isDeleting={deletingId === item.id}
                isSaving={savingId === item.id}
                isRegenerating={regeneratingId === item.id}
                onToggleSelect={toggleSelect}
                onOpen={setActiveItem}
                onCopy={copyItem}
                onSave={saveItem}
                onDelete={requestDelete}
                onRegenerate={regenerateItem}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
