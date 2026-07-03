"use client";

import {
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  LoaderCircle,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveAiHistory } from "@/lib/aiHistory";
import { addStudyNotification } from "@/lib/notifications";
import { generateSingleNotePdf } from "@/lib/pdfExport";
import { getCurrentUser } from "@/lib/supabase";
import AIOutputFormatter from "./AIOutputFormatter";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Surface from "./ui/Surface";

const MAX_INPUT_LENGTH = 12000;

function isSchemaMissingError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("original_text") ||
    message.includes("generated_summary")
  );
}

function getSummaryTitle(input, summary) {
  const firstMeaningfulLine = String(summary || "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^executive summary\s*[:\-]\s*/i, "")
        .trim()
    )
    .find(Boolean);

  const fallback = String(input || "")
    .replace(/\s+/g, " ")
    .trim();

  return (firstMeaningfulLine || fallback || "AI Study Summary").slice(0, 90);
}

export default function AISummaryGenerator() {
  const [input, setInput] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedSummaryId, setSavedSummaryId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanInput = input.trim();
  const characterCount = input.length;
  const isInputTooLong = characterCount > MAX_INPUT_LENGTH;
  const summaryTitle = useMemo(
    () => getSummaryTitle(cleanInput, generatedSummary),
    [cleanInput, generatedSummary]
  );

  useEffect(() => {
    if (!message && !error) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  async function getAuthenticatedSession() {
    const { supabase, user, error: userError } = await getCurrentUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Please log in to use AI Summary.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Your session expired. Please log in again.");
    }

    return { supabase, user, token };
  }

  async function generateSummary(event) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    if (!cleanInput) {
      setError("Please paste your study material first.");
      return;
    }

    if (isInputTooLong) {
      setError(`Please keep your input under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setIsGenerating(true);
    setError("");
    setMessage("");
    setGeneratedSummary("");
    setSavedSummaryId("");

    try {
      const { supabase, user, token } = await getAuthenticatedSession();
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: cleanInput,
          tool: "summary",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate summary.");
      }

      const summary = String(payload.notes || "").trim();

      if (!summary) {
        throw new Error("Gemini did not return a summary. Please try again.");
      }

      setGeneratedSummary(summary);
      setMessage("Summary generated successfully.");

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "AI Summary",
        prompt: cleanInput,
        response: summary,
      });

      if (historyError) {
        // History saving is best-effort; generated summaries should remain usable.
      }

      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Summary generated for "${cleanInput.slice(0, 80)}".`,
        type: "ai",
      });
    } catch (generateError) {
      setError(generateError.message || "Could not generate summary.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copySummary() {
    if (!generatedSummary || isCopying) {
      return;
    }

    setIsCopying(true);
    setError("");
    setMessage("");

    try {
      await navigator.clipboard.writeText(generatedSummary);
      setMessage("Summary copied to clipboard.");
    } catch (_copyError) {
      setError("Copy failed. Please select the summary and copy manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function saveSummary() {
    if (!generatedSummary || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      const { data, error: saveError } = await supabase
        .from("summaries")
        .insert({
          user_id: user.id,
          topic: summaryTitle,
          original_text: cleanInput,
          generated_summary: generatedSummary,
          content: generatedSummary,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (saveError) {
        if (isSchemaMissingError(saveError)) {
          throw new Error("The summaries table needs the original_text and generated_summary columns. Run database/ai-summary.sql in Supabase, then try again.");
        }

        throw saveError;
      }

      setSavedSummaryId(data?.id || "");
      setMessage("Summary saved to your workspace.");
      addStudyNotification(user.id, {
        title: "Summary saved",
        message: `"${summaryTitle}" was saved to your summaries library.`,
        type: "success",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save summary.");
    } finally {
      setIsSaving(false);
    }
  }

  function clearSummary() {
    setInput("");
    setGeneratedSummary("");
    setSavedSummaryId("");
    setError("");
    setMessage("");
  }

  async function downloadPdf() {
    if (!generatedSummary) {
      return;
    }

    try {
      const jspdfModule = await import("jspdf");
      generateSingleNotePdf(
        {
          title: summaryTitle,
          content: generatedSummary,
        },
        jspdfModule.jsPDF
      );
      setMessage("PDF downloaded successfully.");
    } catch (_pdfError) {
      setError("PDF export is not available right now.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Surface className="p-5 sm:p-6">
        <form onSubmit={generateSummary} className="grid gap-5" aria-busy={isGenerating}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Gemini-powered
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-text">
              Paste your study material
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add lecture notes, textbook content, or exam material. StudyAI
              will condense it into a clean revision summary.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-summary-input" className="text-sm font-black text-text">
                Long study material
              </label>
              <span
                id="ai-summary-counter"
                className={`text-xs font-bold ${
                  isInputTooLong ? "text-danger" : "text-muted"
                }`}
              >
                {characterCount}/{MAX_INPUT_LENGTH}
              </span>
            </div>
            <textarea
              id="ai-summary-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={12}
              placeholder="Paste a long paragraph, lecture notes, or textbook section here..."
              className="mt-3 min-h-72 w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sidebar"
              disabled={isGenerating}
              aria-describedby="ai-summary-counter"
              aria-invalid={isInputTooLong}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !cleanInput || isInputTooLong}
              className="w-full"
            >
              {isGenerating ? (
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              {isGenerating ? "Summarizing..." : "Generate Summary"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={clearSummary}
              disabled={isGenerating && !generatedSummary}
              className="w-full"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Clear
            </Button>
          </div>

          <div className="grid gap-3">
            <Toast message={message} />
            <Toast message={error} type="error" />
          </div>
        </form>
      </Surface>

      <Surface className="min-h-[38rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary">
              AI Response
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-text">
              Generated summary
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Copy, save, clear, or export the summary when it is ready.
            </p>
          </div>

          {generatedSummary && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-black text-primary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {savedSummaryId ? "Saved" : "Ready"}
            </span>
          )}
        </div>

        {isGenerating ? (
          <div className="mt-6 grid gap-4" role="status" aria-live="polite">
            <span className="sr-only">Generating summary. Please wait.</span>
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : generatedSummary ? (
          <div className="mt-6 grid gap-5">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <AIOutputFormatter content={generatedSummary} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Button
                type="button"
                variant="secondary"
                onClick={copySummary}
                disabled={isCopying}
                className="w-full"
              >
                {isCopying ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                )}
                Copy
              </Button>
              <Button
                type="button"
                onClick={saveSummary}
                disabled={isSaving || Boolean(savedSummaryId)}
                className="w-full"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {savedSummaryId ? "Saved" : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={downloadPdf}
                className="w-full"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                PDF
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={clearSummary}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No summary generated yet"
            description="Paste long study material and generate a concise Gemini-powered summary."
            className="mt-6 min-h-[28rem]"
          />
        )}
      </Surface>
    </div>
  );
}
