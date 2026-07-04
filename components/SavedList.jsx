"use client";

import {
  FileText,
  LoaderCircle,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateSingleNotePdf } from "@/lib/pdfExport";
import { saveAiHistory } from "@/lib/aiHistory";
import { addStudyNotification } from "@/lib/notifications";
import { saveStudyItem } from "@/lib/saveStudyItem";
import { getSupabase } from "@/lib/supabase";
import FlashcardModal from "./FlashcardModal";
import NotesCard from "./NotesCard";
import QuizModal from "./QuizModal";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Input from "./ui/Input";
import { SkeletonBlock, SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";

const FLASHCARD_SELECT = "id,user_id,note_id,front_text,back_text,created_at";

function getSavedListSelect(type, titleKey, contentKey) {
  if (type === "notes") {
    return "id,user_id,title,content,tags,is_pinned,created_at,updated_at";
  }

  if (type === "summaries") {
    return "id,user_id,topic,content,created_at";
  }

  if (type === "questions") {
    return "id,user_id,question,answer,created_at";
  }

  return `id,user_id,${titleKey},${contentKey},created_at`;
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 8);
}

function formatTags(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function NotesSkeleton() {
  return (
    <div className="mt-5 grid gap-4" aria-label="Loading notes">
      {[0, 1, 2].map((item) => (
        <SkeletonCard
          key={item}
          className="rounded-2xl bg-primary/10 p-4 dark:bg-background/50 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full space-y-3">
              <SkeletonBlock className="h-5 w-2/3 rounded-full" />
              <SkeletonBlock className="h-3 w-32 rounded-full" />
              <div className="flex flex-wrap gap-2 pt-2">
                <SkeletonBlock className="h-7 w-16 rounded-full" />
                <SkeletonBlock className="h-7 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-11 w-11 rounded-full" />
              <SkeletonBlock className="h-11 w-11 rounded-full" />
              <SkeletonBlock className="h-11 w-11 rounded-full" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

export default function SavedList({
  type,
  titleKey = "topic",
  contentKey = "content",
  canCreate = false,
  canEdit = false,
  enableNoteTools = false,
  searchPlaceholder = "Search saved items...",
  emptyTitle = "No saved items yet",
  emptyText = "No saved items yet.",
}) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedTag, setSelectedTag] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [openId, setOpenId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [exportingPdfId, setExportingPdfId] = useState(null);
  const [generatingQuizId, setGeneratingQuizId] = useState(null);
  const [generatingFlashcardsId, setGeneratingFlashcardsId] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeFlashcards, setActiveFlashcards] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const availableTags = useMemo(() => {
    const tags = items.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []));
    return [...new Set(tags)].sort((first, second) => first.localeCompare(second));
  }, [items]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        const title = String(item[titleKey] || "").toLowerCase();
        const content = String(item[contentKey] || "").toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const matchesSearch =
          !cleanQuery ||
          title.includes(cleanQuery) ||
          content.includes(cleanQuery) ||
          tags.some((tag) => tag.includes(cleanQuery));
        const matchesTag = selectedTag === "all" || tags.includes(selectedTag);

        return matchesSearch && matchesTag;
      })
      .sort((first, second) => {
        if (enableNoteTools && first.is_pinned !== second.is_pinned) {
          return first.is_pinned ? -1 : 1;
        }

        const firstTime = new Date(first.created_at).getTime();
        const secondTime = new Date(second.created_at).getTime();

        return sortOrder === "oldest" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [contentKey, enableNoteTools, items, query, selectedTag, sortOrder, titleKey]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    let channel;

    function upsertItem(nextItem) {
      if (!nextItem?.id) {
        return;
      }

      setItems((currentItems) => {
        const exists = currentItems.some((item) => item.id === nextItem.id);

        if (!exists) {
          return [nextItem, ...currentItems];
        }

        return currentItems.map((item) => (item.id === nextItem.id ? nextItem : item));
      });
    }

    async function loadItems() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        const user = userData.user;

        if (!user) {
          throw new Error("Please login to view saved items.");
        }

        const { data, error: loadError } = await supabase
          .from(type)
          .select(getSavedListSelect(type, titleKey, contentKey))
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (loadError) {
          throw loadError;
        }

        if (ignore) {
          return;
        }

        setItems(data || []);
        setIsLoading(false);

        if (enableNoteTools) {
          const channelName = `private-notes-${user.id}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

          channel = supabase.channel(channelName);

          channel.on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notes",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.eventType === "DELETE") {
                setItems((currentItems) =>
                  currentItems.filter((item) => item.id !== payload.old?.id)
                );
                setOpenId((currentId) =>
                  currentId === payload.old?.id ? null : currentId
                );
                setEditingId((currentId) =>
                  currentId === payload.old?.id ? null : currentId
                );
                return;
              }

              upsertItem(payload.new);
            }
          );

          channel.subscribe();
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message);
          setIsLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      ignore = true;

      if (channel) {
        getSupabase().removeChannel(channel);
      }
    };
  }, [enableNoteTools, type]);

  function resetCreateForm() {
    setNewTitle("");
    setNewContent("");
    setNewTags("");
  }

  async function createItem(event) {
    event.preventDefault();

    if (!canCreate || isCreating) {
      return;
    }

    const cleanTitle = newTitle.trim();
    const cleanContent = newContent.trim();

    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }

    if (!cleanContent) {
      setError("Content is required.");
      return;
    }

    setError("");
    setToast("");
    setIsCreating(true);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const data = await saveStudyItem(supabase, {
        type,
        title: cleanTitle,
        content: cleanContent,
        tags: parseTags(newTags),
      });
      const nextItem = {
        ...data,
        [titleKey]: data?.[titleKey] || cleanTitle,
        [contentKey]: data?.[contentKey] || cleanContent,
        tags: data?.tags || parseTags(newTags),
        is_pinned: Boolean(data?.is_pinned),
      };

      setItems((currentItems) => {
        if (currentItems.some((item) => item.id === nextItem.id)) {
          return currentItems;
        }

        return [nextItem, ...currentItems];
      });
      resetCreateForm();
      setToast("Note created successfully.");
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this saved item?")) {
      return;
    }

    setError("");
    setToast("");
    setDeletingId(id);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const { error: deleteError } = await supabase
        .from(type)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
      setOpenId((currentId) => (currentId === id ? null : currentId));
      setEditingId((currentId) => (currentId === id ? null : currentId));
      setToast("Deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(item) {
    if (!canEdit) {
      return;
    }

    setError("");
    setToast("");
    setOpenId(null);
    setEditingId(item.id);
    setEditTitle(String(item[titleKey] || ""));
    setEditContent(String(item[contentKey] || ""));
    setEditTags(formatTags(item.tags));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
  }

  async function updateItem(item) {
    if (!canEdit || updatingId) {
      return;
    }

    const cleanTitle = editTitle.trim();
    const cleanContent = editContent.trim();

    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }

    if (!cleanContent) {
      setError("Content is required.");
      return;
    }

    setError("");
    setToast("");
    setUpdatingId(item.id);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const updates = {
        [titleKey]: cleanTitle,
        [contentKey]: cleanContent,
      };

      if (enableNoteTools) {
        updates.tags = parseTags(editTags);
      }

      const { data, error: updateError } = await supabase
        .from(type)
        .update(updates)
        .eq("id", item.id)
        .eq("user_id", user.id)
        .select(getSavedListSelect(type, titleKey, contentKey))
        .single();

      if (updateError) {
        throw updateError;
      }

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? data : currentItem
        )
      );
      cancelEdit();
      setToast("Updated successfully.");
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function togglePin(item) {
    if (!enableNoteTools || pinningId) {
      return;
    }

    setError("");
    setToast("");
    setPinningId(item.id);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const nextPinned = !item.is_pinned;
      const { data, error: pinError } = await supabase
        .from(type)
        .update({ is_pinned: nextPinned })
        .eq("id", item.id)
        .eq("user_id", user.id)
        .select(getSavedListSelect(type, titleKey, contentKey))
        .single();

      if (pinError) {
        throw pinError;
      }

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? data : currentItem
        )
      );
      setToast(nextPinned ? "Note pinned." : "Note unpinned.");
    } catch (pinError) {
      setError(pinError.message);
    } finally {
      setPinningId(null);
    }
  }

  async function downloadItemPdf(itemId) {
    if (!enableNoteTools || exportingPdfId) {
      return;
    }

    setError("");
    setToast("");
    setExportingPdfId(itemId);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login before exporting this note.");
      }

      const { data: note, error: noteError } = await supabase
        .from("notes")
        .select("id,title,content,created_at")
        .eq("id", itemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (noteError) {
        throw noteError;
      }

      if (!note) {
        throw new Error("This note was not found for your account.");
      }

      const jspdfModule = await import("jspdf");
      generateSingleNotePdf(note, jspdfModule.jsPDF);
      setToast("PDF downloaded successfully.");
    } catch (pdfError) {
      setError(pdfError.message || "Could not download PDF.");
    } finally {
      setExportingPdfId(null);
    }
  }

  async function generateQuiz(item) {
    if (!enableNoteTools || generatingQuizId) {
      return;
    }

    setError("");
    setToast("");
    setGeneratingQuizId(item.id);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login before generating a quiz.");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please login again.");
      }

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: item[titleKey],
          topic: item[titleKey],
          content: item[contentKey],
          difficulty: "medium",
          totalQuestions: 5,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate quiz.");
      }

      const history = await saveStudyItem(supabase, {
        type: "quiz_history",
        note_id: item.id,
        title: item[titleKey],
        difficulty: "medium",
        total_questions: Array.isArray(payload.quiz?.questions)
          ? payload.quiz.questions.length
          : 0,
        quiz_data: payload.quiz,
        score: null,
      });

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "Quiz Generator",
        prompt: `${item[titleKey]}\n\n${item[contentKey]}`,
        response: JSON.stringify(payload.quiz, null, 2),
      });

      if (historyError) {
        // History saving is best-effort; generated quiz should remain usable.
      }

      setActiveQuiz({
        noteTitle: item[titleKey],
        quiz: payload.quiz,
        historyId: history.id,
      });
      setToast("Quiz generated and saved.");
      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Quiz generated for "${String(item[titleKey] || "your note").slice(0, 80)}".`,
        type: "ai",
      });
    } catch (quizError) {
      setError(quizError.message);
    } finally {
      setGeneratingQuizId(null);
    }
  }

  async function saveQuizScore(score) {
    if (!activeQuiz?.historyId) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const { error: updateError } = await supabase
        .from("quiz_history")
        .update({ score })
        .eq("id", activeQuiz.historyId)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    } catch (scoreError) {
      setError(scoreError.message);
    }
  }

  async function generateFlashcards(item) {
    if (!enableNoteTools || generatingFlashcardsId) {
      return;
    }

    setError("");
    setToast("");
    setGeneratingFlashcardsId(item.id);

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login before generating flashcards.");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please login again.");
      }

      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: item[titleKey],
          topic: item[titleKey],
          content: item[contentKey],
          totalCards: 10,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate flashcards.");
      }

      const rows = (payload.flashcards || []).map((card) => ({
        user_id: user.id,
        note_id: item.id,
        front_text: card.front_text,
        back_text: card.back_text,
      }));

      if (rows.length === 0) {
        throw new Error("No flashcards were generated.");
      }

      const { data: savedCards, error: saveError } = await supabase
        .from("flashcards")
        .insert(rows)
        .select(FLASHCARD_SELECT);

      if (saveError) {
        throw saveError;
      }

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "Flashcard Generator",
        prompt: `${item[titleKey]}\n\n${item[contentKey]}`,
        response: JSON.stringify(payload.flashcards || [], null, 2),
      });

      if (historyError) {
        // History saving is best-effort; generated flashcards should remain usable.
      }

      setActiveFlashcards({
        noteTitle: item[titleKey],
        cards: savedCards || rows,
      });
      setToast("Flashcards generated and saved.");
      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Flashcards generated for "${String(item[titleKey] || "your note").slice(0, 80)}".`,
        type: "ai",
      });
    } catch (flashcardError) {
      setError(flashcardError.message);
    } finally {
      setGeneratingFlashcardsId(null);
    }
  }

  return (
    <div className="space-y-5">
      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz.quiz}
          noteTitle={activeQuiz.noteTitle}
          onClose={() => setActiveQuiz(null)}
          onSubmitScore={saveQuizScore}
        />
      )}

      {activeFlashcards && (
        <FlashcardModal
          cards={activeFlashcards.cards}
          noteTitle={activeFlashcards.noteTitle}
          onClose={() => setActiveFlashcards(null)}
        />
      )}

      {canCreate && (
        <form
          onSubmit={createItem}
          aria-busy={isCreating}
          className="rounded-2xl border border-border bg-card p-4 shadow-card transition duration-200 dark:border-border dark:bg-card sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-normal text-text dark:text-text">
                Create a new note
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted dark:text-muted">
                Add your own study note, then tag it for quick revision later.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {isCreating ? "Creating..." : "Add note"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              disabled={isCreating}
              placeholder="Note title"
              aria-label="New note title"
            />
            <Input
              value={newTags}
              onChange={(event) => setNewTags(event.target.value)}
              disabled={isCreating}
              placeholder="Tags, comma separated e.g. biology, exam"
              aria-label="New note tags"
            />
          </div>

          <textarea
            value={newContent}
            onChange={(event) => setNewContent(event.target.value)}
            disabled={isCreating}
            rows={5}
            placeholder="Write note content..."
            aria-label="New note content"
            className="mt-4 min-h-36 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:border-border dark:bg-sidebar dark:text-text dark:focus:bg-sidebar"
          />
        </form>
      )}

      <Surface className="p-4 sm:p-5" padding="none">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <Input
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />

          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted" aria-hidden="true" />
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort saved items"
              className="min-h-12 w-full appearance-none rounded-xl border border-border bg-background py-3 pl-11 pr-9 text-sm font-semibold text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text lg:w-44"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>

          {enableNoteTools && (
            <label className="relative">
              <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted" aria-hidden="true" />
              <select
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
                aria-label="Filter by tag"
                className="min-h-12 w-full appearance-none rounded-xl border border-border bg-background py-3 pl-11 pr-9 text-sm font-semibold text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text lg:w-48"
              >
                <option value="all">All tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {enableNoteTools && availableTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag("all")}
              aria-pressed={selectedTag === "all"}
              className={`min-h-9 break-words rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selectedTag === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-primary/10 text-primary-hover hover:bg-primary/15 dark:bg-primary/15 dark:text-primary"
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                aria-pressed={selectedTag === tag}
                className={`min-h-9 break-words rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  selectedTag === tag
                    ? "bg-primary text-white shadow-sm"
                    : "bg-primary/10 text-primary-hover hover:bg-primary/15 dark:bg-primary/15 dark:text-primary"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <Toast message={toast} />
          <Toast message={error} type="error" />
        </div>

        {isLoading ? (
          <NotesSkeleton />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={items.length === 0 ? emptyTitle : "No matching results"}
            description={
              items.length === 0
                ? emptyText
                : "No notes match your current search or tag filter."
            }
            className="mt-5 px-4 py-12 sm:px-6 sm:py-14"
          />
        ) : (
          <div className="mt-5 grid gap-4">
            {filteredItems.map((item) => {
              const isOpen = openId === item.id;
              const isEditing = editingId === item.id;

              return (
                <NotesCard
                  key={item.id}
                  itemId={item.id}
                  title={item[titleKey]}
                  content={item[contentKey]}
                  tags={item.tags}
                  isPinned={Boolean(item.is_pinned)}
                  createdAt={item.created_at}
                  updatedAt={item.updated_at}
                  isOpen={isOpen}
                  canEdit={canEdit}
                  canPin={enableNoteTools}
                  canExportPdf={enableNoteTools}
                  canGenerateQuiz={enableNoteTools}
                  canGenerateFlashcards={enableNoteTools}
                  isEditing={isEditing}
                  editTitle={editTitle}
                  editContent={editContent}
                  editTags={editTags}
                  isUpdating={updatingId === item.id}
                  isDeleting={deletingId === item.id}
                  isPinning={pinningId === item.id}
                  isExportingPdf={exportingPdfId === item.id}
                  isGeneratingQuiz={generatingQuizId === item.id}
                  isGeneratingFlashcards={generatingFlashcardsId === item.id}
                  onToggle={() => setOpenId(isOpen ? null : item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onStartEdit={() => startEdit(item)}
                  onCancelEdit={cancelEdit}
                  onEditTitleChange={setEditTitle}
                  onEditContentChange={setEditContent}
                  onEditTagsChange={setEditTags}
                  onSaveEdit={() => updateItem(item)}
                  onTogglePin={() => togglePin(item)}
                  onDownloadPdf={() => downloadItemPdf(item.id)}
                  onGenerateQuiz={() => generateQuiz(item)}
                  onGenerateFlashcards={() => generateFlashcards(item)}
                />
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
