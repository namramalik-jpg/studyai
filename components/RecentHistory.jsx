"use client";

import { Eye, History, LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Toast from "./Toast";
import EmptyState from "./ui/EmptyState";
import Button from "./ui/Button";
import SectionHeader from "./ui/SectionHeader";
import { SkeletonBlock, SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";

const AI_HISTORY_SELECT = "id,user_id,feature,prompt,response,created_at";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function HistorySkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((item) => (
        <SkeletonCard
          key={item}
          className="p-4"
        >
          <SkeletonBlock className="h-4 w-32 rounded-full" />
          <SkeletonBlock className="mt-3 h-5 w-2/3 rounded-full" />
          <SkeletonBlock className="mt-3 h-3 w-40 rounded-full" />
        </SkeletonCard>
      ))}
    </div>
  );
}

export default function RecentHistory() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
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
          throw new Error("Please login to view AI history.");
        }

        const { data, error: historyError } = await supabase
          .from("ai_history")
          .select(AI_HISTORY_SELECT)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8);

        if (historyError) {
          throw historyError;
        }

        if (!ignore) {
          setItems(data || []);
        }
      } catch (historyError) {
        if (!ignore) {
          setError(historyError.message || "Could not load AI history.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, []);

  async function deleteHistoryItem(item) {
    setDeletingId(item.id);
    setError("");

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
        .from("ai_history")
        .delete()
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setItems((currentItems) => currentItems.filter((historyItem) => historyItem.id !== item.id));
      setActiveItem((currentItem) => (currentItem?.id === item.id ? null : currentItem));
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete history item.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Surface className="mt-6">
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="history-response-title">
          <div className="max-h-[calc(100dvh-3rem)] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-card dark:border-border dark:bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5 dark:border-border">
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary-hover dark:text-primary">
                  {activeItem.feature}
                </p>
                <h3 id="history-response-title" className="mt-1 break-words text-xl font-bold tracking-normal text-text dark:text-text">
                  Full AI Response
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:bg-sidebar dark:text-muted dark:hover:bg-primary/15"
                aria-label="Close response"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-5 study-scrollbar sm:max-h-[62vh]">
              <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-muted">
                Prompt
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-text dark:border-border dark:bg-sidebar dark:text-text">
                {activeItem.prompt}
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted dark:text-muted">
                Response
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-text dark:border-border dark:bg-sidebar dark:text-text">
                {activeItem.response}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          eyebrow="Recent History"
          title="Latest AI requests"
          description="Review recent notes, summaries, solved questions, quizzes, and flashcards."
          icon={History}
        />
      </div>

      <div className="mb-4">
        <Toast message={error} type="error" />
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No AI history yet"
          description="Generate notes, summaries, questions, quizzes, or flashcards and your recent activity will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card dark:border-border dark:bg-sidebar dark:hover:bg-card sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    {item.feature}
                  </p>
                  <h3 className="mt-3 line-clamp-2 break-words text-base font-bold text-text dark:text-text">
                    {item.prompt}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-muted dark:text-muted">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    variant="secondary"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View
                  </Button>
                  <Button
                    type="button"
                    onClick={() => deleteHistoryItem(item)}
                    disabled={deletingId === item.id}
                    variant="danger"
                    size="sm"
                  >
                    {deletingId === item.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
