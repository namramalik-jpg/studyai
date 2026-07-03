"use client";

import { CheckCircle2, LoaderCircle, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { saveAiHistory } from "@/lib/aiHistory";
import { addStudyNotification } from "@/lib/notifications";
import { getCurrentUser, getSupabase } from "@/lib/supabase";
import ScrollReveal from "./ScrollReveal";
import Button from "./ui/Button";

const toolModes = [
  {
    id: "notes",
    badge: "AI Notes Generator",
    title: "Generate real study notes in seconds",
    description: "Enter a topic and let StudyAI create organized notes with Gemini.",
    label: "Enter Topic",
    placeholder: "Example: Newton's laws of motion",
    button: "Generate Notes",
    saveButton: "Save Notes",
    saveType: "notes",
    loading: "Generating notes...",
    userText: "Generate notes about",
    emptyText: "Type a topic and click Generate Notes. Gemini-generated study notes will appear here.",
  },
  {
    id: "question",
    badge: "Question Solver",
    title: "Solve study questions step by step",
    description: "Paste a question and get a clear, beginner-friendly solution.",
    label: "Enter Question",
    placeholder: "Example: If a car travels 120 km in 2 hours, find its speed.",
    button: "Solve Question",
    saveButton: "Save Answer",
    saveType: "questions",
    loading: "Solving question...",
    userText: "Solve this question",
    emptyText: "Type a question and click Solve Question. The step-by-step answer will appear here.",
  },
  {
    id: "summary",
    badge: "Quick Summaries",
    title: "Summarize topics into quick revision notes",
    description: "Paste a topic or paragraph and get a short, clean study summary.",
    label: "Enter Topic or Text",
    placeholder: "Example: Paste a paragraph about the water cycle.",
    button: "Summarize",
    saveButton: "Save Summary",
    saveType: "summaries",
    loading: "Summarizing...",
    userText: "Summarize",
    emptyText: "Type or paste content and click Summarize. A quick revision summary will appear here.",
  },
];

export default function AIDemo() {
  const [selectedTool, setSelectedTool] = useState("notes");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const currentTool = useMemo(
    () => toolModes.find((tool) => tool.id === selectedTool) || toolModes[0],
    [selectedTool]
  );

  useEffect(() => {
    try {
      const supabase = getSupabase();

      getCurrentUser().then(({ user: currentUser }) => {
        setUser(currentUser);
      });

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    } catch (_error) {
      setUser(null);
      return undefined;
    }
  }, []);

  useEffect(() => {
    function handleToolMode(event) {
      const nextTool = event.detail?.tool;

      if (toolModes.some((tool) => tool.id === nextTool)) {
        setSelectedTool(nextTool);
        setNotes("");
        setError("");
        setSaveMessage("");
      }
    }

    window.addEventListener("studyai:set-tool-mode", handleToolMode);

    return () => {
      window.removeEventListener("studyai:set-tool-mode", handleToolMode);
    };
  }, []);

  function selectTool(toolId) {
    setSelectedTool(toolId);
    setNotes("");
    setError("");
    setSaveMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError(`Please fill the ${currentTool.label.toLowerCase()} field first.`);
      setNotes("");
      return;
    }

    setIsLoading(true);
    setNotes("");
    setError("");
    setSaveMessage("");

    try {
      const { supabase, user: currentUser, error: userError } = await getCurrentUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        throw new Error("Please login to generate AI study material.");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Your session expired. Please login again.");
      }

      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: cleanTopic, tool: currentTool.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate notes.");
      }

      setNotes(data.notes);

      try {
        const { error: historyError } = await saveAiHistory({
          supabase,
          userId: currentUser.id,
          feature: currentTool.badge,
          prompt: cleanTopic,
          response: data.notes,
        });

        if (historyError) {
          // History saving is best-effort for the landing demo.
        }

        addStudyNotification(currentUser.id, {
          title: "AI generation completed",
          message: `${currentTool.badge} finished for "${cleanTopic.slice(0, 80)}".`,
          type: "ai",
        });
      } catch (_historyError) {
        // History saving is best-effort for the landing demo.
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const cleanTopic = topic.trim();
    const cleanNotes = notes.trim();

    if (!cleanTopic) {
      setSaveMessage(`Please fill the ${currentTool.label.toLowerCase()} field before saving.`);
      return;
    }

    if (!cleanNotes) {
      setSaveMessage("Generate content before saving.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      const { supabase, user: currentUser, error: userError } = await getCurrentUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        setSaveMessage("Please login before saving.");
        return;
      }

      const table = currentTool.saveType;
      let row;

      if (table === "questions") {
        row = {
          user_id: currentUser.id,
          question: cleanTopic,
          answer: cleanNotes,
        };
      } else if (table === "notes") {
        row = {
          user_id: currentUser.id,
          title: cleanTopic,
          content: cleanNotes,
        };
      } else {
        row = {
          user_id: currentUser.id,
          topic: cleanTopic,
          content: cleanNotes,
        };
      }

      const { error: saveError } = await supabase.from(table).insert(row);

      if (saveError) {
        throw saveError;
      }

      setSaveMessage("Saved successfully.");
    } catch (saveError) {
      setSaveMessage(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      id="ai-notes"
      className="landing-section"
    >
      <div className="pointer-events-none absolute -left-40 top-6 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-10rem] top-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.11)_0%,rgba(99,102,241,0.05)_34%,transparent_72%)] blur-sm" />
      <div className="pointer-events-none absolute left-[18%] bottom-12 h-20 w-20 rounded-full bg-primary/10 blur-2xl animate-pulse-glow" />
      <div className="pointer-events-none absolute right-[24%] top-14 h-16 w-16 rounded-full bg-violet-400/10 blur-2xl animate-pulse-glow" />
      <div className="landing-hairline" />

      <div className="landing-container">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="break-words">{currentTool.badge}</span>
          </p>
          <h2 className="landing-title mt-5 lg:text-4xl">
            {currentTool.title}
          </h2>
          <p className="landing-subtitle">
            {currentTool.description}
          </p>
        </ScrollReveal>

        <ScrollReveal delay="delay-150" className="mx-auto mt-12 max-w-5xl">
          <div className="landing-card landing-card-hover overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">
                  AI
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    StudyAI Notes Assistant
                  </p>
                  <p className="text-xs text-slate-500">
                    Online and ready
                  </p>
                </div>
              </div>
              <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
                Smart mode
              </span>
            </div>

            <div className="grid gap-5 p-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6 lg:p-7">
              <form
                onSubmit={handleSubmit}
                aria-busy={isLoading}
                className="landing-inner-card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] sm:p-5"
              >
                <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-3" role="radiogroup" aria-label="AI demo mode">
                  {toolModes.map((tool) => {
                    const isSelected = currentTool.id === tool.id;

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => selectTool(tool.id)}
                        role="radio"
                        aria-checked={isSelected}
                        className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold leading-tight transition ${
                          isSelected
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-500 hover:bg-white hover:text-primary-hover"
                        }`}
                      >
                        {tool.badge}
                      </button>
                    );
                  })}
                </div>

                <label
                  htmlFor="topic"
                  className="text-sm font-bold text-slate-950"
                >
                  {currentTool.label}
                </label>
                <textarea
                  id="topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  rows={6}
                  aria-describedby={error ? "demo-error" : undefined}
                  aria-invalid={Boolean(error)}
                  className="mt-3 min-h-40 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                  placeholder={currentTool.placeholder}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden="true" />
                  )}
                  {isLoading ? currentTool.loading : currentTool.button}
                </Button>
              </form>

              <div className="landing-inner-card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] sm:p-5">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-slate-950">
                    Generated Output
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-primary/10 px-3 py-1 text-xs font-bold text-primary-hover">
                    {isLoading ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isLoading ? "Working" : notes ? "Gemini output" : "Ready"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="ml-auto max-w-full break-words rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-white shadow-sm [overflow-wrap:anywhere] sm:max-w-[85%]">
                    {currentTool.userText}: {topic.trim() || "your input"}.
                  </div>

                  <div className="max-w-full break-words rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere] sm:max-w-[92%]">
                    {isLoading ? (
                      <div className="space-y-3" role="status">
                        <div className="flex items-center gap-2 font-semibold text-primary-hover">
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                          {currentTool.loading}
                        </div>
                        <span className="block h-2.5 w-full animate-pulse rounded-full bg-slate-200" />
                        <span className="block h-2.5 w-5/6 animate-pulse rounded-full bg-slate-200" />
                        <span className="block h-2.5 w-2/3 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    ) : error ? (
                      <div id="demo-error" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
                        {error}
                      </div>
                    ) : notes ? (
                      <div>
                        <div className="whitespace-pre-line break-words text-slate-950 [overflow-wrap:anywhere]">
                          {notes}
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                          {user ? (
                            <Button
                              type="button"
                              onClick={handleSave}
                              disabled={isSaving}
                              className="w-full sm:w-auto"
                            >
                              {isSaving ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              )}
                              {isSaving ? "Saving..." : currentTool.saveButton}
                            </Button>
                          ) : (
                            <Link
                              href="/login"
                              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/25 sm:w-auto"
                            >
                              Login to save
                            </Link>
                          )}

                          {saveMessage && (
                            <p className="text-sm font-semibold text-slate-500">
                              {saveMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {currentTool.emptyText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
