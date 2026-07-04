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

const MAX_PROMPT_LENGTH = 3000;

function isNotesSetupError(error) {
  const message = error?.message || "";
  const lowerMessage = message.toLowerCase();

  return (
    message.includes("Could not find") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("prompt") ||
    message.includes("generated_notes") ||
    message.includes("tags") ||
    message.includes("is_pinned") ||
    message.includes("content") ||
    message.includes("title") ||
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("permission denied")
  );
}

function getNoteTitle(prompt, notes) {
  const firstMeaningfulLine = String(notes || "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^title\s*[:\-]\s*/i, "")
        .trim()
    )
    .find(Boolean);

  return (firstMeaningfulLine || prompt || "AI Study Notes").slice(0, 90);
}

export default function AINotesGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanPrompt = prompt.trim();
  const characterCount = prompt.length;
  const isPromptTooLong = characterCount > MAX_PROMPT_LENGTH;
  const noteTitle = useMemo(
    () => getNoteTitle(cleanPrompt, generatedNotes),
    [cleanPrompt, generatedNotes]
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
      throw new Error("Please log in to use AI Notes.");
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

  async function generateNotes(event) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    if (!cleanPrompt) {
      setError("Please enter a topic or prompt first.");
      return;
    }

    if (isPromptTooLong) {
      setError(`Please keep your prompt under ${MAX_PROMPT_LENGTH} characters.`);
      return;
    }

    setIsGenerating(true);
    setError("");
    setMessage("");
    setGeneratedNotes("");
    setSavedNoteId("");

    try {
      const { supabase, user, token } = await getAuthenticatedSession();
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: cleanPrompt,
          tool: "notes",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate notes.");
      }

      const notes = String(payload.notes || "").trim();

      if (!notes) {
        throw new Error("Gemini did not return notes. Please try again.");
      }

      setGeneratedNotes(notes);
      setMessage("Notes generated successfully.");

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "AI Notes Generator",
        prompt: cleanPrompt,
        response: notes,
      });

      if (historyError) {
        // History saving is best-effort; generated notes should remain usable.
      }

      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Notes generated for "${cleanPrompt.slice(0, 80)}".`,
        type: "ai",
      });
    } catch (generateError) {
      setError(generateError.message || "Could not generate notes.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyNotes() {
    if (!generatedNotes || isCopying) {
      return;
    }

    setIsCopying(true);
    setError("");
    setMessage("");

    try {
      await navigator.clipboard.writeText(generatedNotes);
      setMessage("Notes copied to clipboard.");
    } catch (_copyError) {
      setError("Copy failed. Please select the notes and copy manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function saveNotes() {
    if (!generatedNotes || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      const { data, error: saveError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: noteTitle,
          prompt: cleanPrompt,
          generated_notes: generatedNotes,
          content: generatedNotes,
          tags: ["ai-notes"],
          is_pinned: false,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (saveError) {
        if (isNotesSetupError(saveError)) {
          throw new Error("AI notes saving is not set up in Supabase yet. Run database/ai-notes.sql in the Supabase SQL Editor, then try again.");
        }

        throw saveError;
      }

      setSavedNoteId(data?.id || "");
      setMessage("Notes saved to your workspace.");
      addStudyNotification(user.id, {
        title: "Notes saved",
        message: `"${noteTitle}" was saved to your notes library.`,
        type: "success",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save notes.");
    } finally {
      setIsSaving(false);
    }
  }

  function clearNotes() {
    setPrompt("");
    setGeneratedNotes("");
    setSavedNoteId("");
    setError("");
    setMessage("");
  }

  async function downloadPdf() {
    if (!generatedNotes) {
      return;
    }

    try {
      const jspdfModule = await import("jspdf");
      generateSingleNotePdf(
        {
          title: noteTitle,
          content: generatedNotes,
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
        <form onSubmit={generateNotes} className="grid gap-5" aria-busy={isGenerating}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Gemini-powered
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-text">
              What do you want to study?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enter a topic, chapter, question area, or pasted study material.
              StudyAI will turn it into clear revision notes.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-notes-prompt" className="text-sm font-black text-text">
                Study topic or prompt
              </label>
              <span
                id="ai-notes-counter"
                className={`text-xs font-bold ${
                  isPromptTooLong ? "text-danger" : "text-muted"
                }`}
              >
                {characterCount}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <textarea
              id="ai-notes-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={12}
              placeholder="Example: Explain photosynthesis for biology exam revision, including key concepts, examples, and practice questions."
              className="mt-3 min-h-72 w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sidebar"
              disabled={isGenerating}
              aria-describedby="ai-notes-counter"
              aria-invalid={isPromptTooLong}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !cleanPrompt || isPromptTooLong}
              className="w-full"
            >
              {isGenerating ? (
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              {isGenerating ? "Generating..." : "Generate Notes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={clearNotes}
              disabled={isGenerating && !generatedNotes}
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
              Generated study notes
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Copy, save, clear, or export the generated notes when they are ready.
            </p>
          </div>

          {generatedNotes && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-black text-primary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {savedNoteId ? "Saved" : "Ready"}
            </span>
          )}
        </div>

        {isGenerating ? (
          <div className="mt-6 grid gap-4" role="status" aria-live="polite">
            <span className="sr-only">Generating study notes. Please wait.</span>
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : generatedNotes ? (
          <div className="mt-6 grid gap-5">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <AIOutputFormatter content={generatedNotes} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Button
                type="button"
                variant="secondary"
                onClick={copyNotes}
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
                onClick={saveNotes}
                disabled={isSaving || Boolean(savedNoteId)}
                className="w-full"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {savedNoteId ? "Saved" : "Save"}
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
                onClick={clearNotes}
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
            title="No notes generated yet"
            description="Enter a study topic and generate your first Gemini-powered notes."
            className="mt-6 min-h-[28rem]"
          />
        )}
      </Surface>
    </div>
  );
}

