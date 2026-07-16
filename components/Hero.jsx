"use client";

import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  PlayCircle,
  Save,
  Sparkles,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const workspaceModes = [
  {
    id: "notes",
    label: "Smart Notes",
    icon: FileText,
    prompt: "Explain photosynthesis for an exam revision sheet.",
    output:
      "Photosynthesis converts light energy into chemical energy. Plants use sunlight, carbon dioxide, and water to produce glucose and oxygen. Key formula: 6CO2 + 6H2O -> C6H12O6 + 6O2.",
  },
  {
    id: "summary",
    label: "Summary",
    icon: Layers3,
    prompt: "Summarize Newton's laws in simple language.",
    output:
      "Newton's laws explain motion: objects resist change, force equals mass times acceleration, and every action has an equal opposite reaction.",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: BookOpenCheck,
    prompt: "Create a quick quiz from my biology notes.",
    output:
      "1. What gas do plants absorb? 2. Where does photosynthesis happen? 3. What is glucose used for? Answer key included after the quiz.",
  },
];

const socialAvatars = [
  { initials: "AM", className: "bg-primary" },
  { initials: "SK", className: "bg-violet-500" },
  { initials: "JR", className: "bg-sky-500" },
  { initials: "NL", className: "bg-emerald-500" },
  { initials: "HZ", className: "bg-rose-500" },
];

export default function Hero() {
  const [activeMode, setActiveMode] = useState(workspaceModes[0].id);
  const [typedOutput, setTypedOutput] = useState("");

  const currentMode = useMemo(
    () => workspaceModes.find((mode) => mode.id === activeMode) || workspaceModes[0],
    [activeMode]
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setTypedOutput(currentMode.output);
      return undefined;
    }

    let index = 0;
    setTypedOutput("");

    const typingTimer = setInterval(() => {
      index += 2;
      setTypedOutput(currentMode.output.slice(0, index));

      if (index >= currentMode.output.length) {
        clearInterval(typingTimer);
      }
    }, 22);

    return () => clearInterval(typingTimer);
  }, [currentMode]);

  return (
    <section
      id="home"
      className="landing-hero relative isolate overflow-hidden pt-6 sm:pt-8"
    >
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.08)_38%,transparent_70%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16)_0%,rgba(99,102,241,0.08)_36%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute left-[46%] top-20 h-16 w-16 rounded-full bg-primary/10 blur-2xl animate-pulse-glow" />
      <div className="pointer-events-none absolute right-[14%] bottom-12 h-20 w-20 rounded-full bg-violet-400/10 blur-2xl animate-pulse-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-9 px-4 pb-10 sm:px-6 sm:pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-8 lg:pb-14">
        <div className="min-w-0 studyai-fade-in">
          <div className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI study workspace for focused learners
          </div>

          <h1 className="mt-4 max-w-3xl text-[clamp(1.95rem,8.8vw,2.25rem)] font-black leading-[1.05] tracking-tight text-text sm:text-[3.2rem] sm:leading-[1.04] lg:text-[3.85rem]">
            Turn Any Topic Into
            <span className="block bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Smart Notes,
            </span>
            {" "}
            <span className="block">Summaries & Quizzes.</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-muted">
            StudyAI transforms any topic into clear notes, concise summaries,
            practice questions, and quizzes in seconds.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#ai-notes"
              className="landing-button-primary w-full sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="#features"
              className="landing-button-secondary w-full sm:w-auto"
            >
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              See How It Works
            </a>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/75 p-3 shadow-sm backdrop-blur sm:max-w-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3" aria-hidden="true">
                {socialAvatars.map((avatar) => (
                  <span
                    key={avatar.initials}
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 border-card text-[0.68rem] font-black text-white shadow-sm ${avatar.className}`}
                  >
                    {avatar.initials}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-warning" aria-label="Rated 4.9 out of 5">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <Star key={item} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  ))}
                  <span className="ml-1 text-xs font-black text-text">4.9/5</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-muted">
                  Trusted by <span className="font-black text-text">5,000+ Students</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Exam ready
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-full min-w-0 studyai-scale-in sm:max-w-[34rem] lg:mx-0 lg:justify-self-end">
          <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,rgba(139,92,246,0.12)_34%,transparent_72%)] blur-xl" />

          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-2.5 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_26px_80px_rgba(2,6,23,0.48)] sm:p-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950/80 dark:text-white">
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-300" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                  <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
                  Interactive AI Workspace
                </div>
              </div>

              <div className="grid gap-3 p-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Quick Summary", "bg-primary/10 text-primary dark:bg-primary/15 dark:text-indigo-100"],
                    ["Quiz Ready", "bg-success/10 text-emerald-700 dark:bg-success/15 dark:text-emerald-100"],
                    ["Flashcards", "bg-warning/10 text-amber-700 dark:bg-warning/15 dark:text-amber-100"],
                  ].map(([label, className], index) => (
                    <span
                      key={label}
                      className={`inline-flex min-h-8 items-center rounded-full border border-slate-200 px-3 text-xs font-bold dark:border-white/10 ${className} ${index === 1 ? "animate-pulse-glow" : ""}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/10" role="radiogroup" aria-label="AI workspace preview mode">
                  {workspaceModes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setActiveMode(mode.id)}
                        role="radio"
                        aria-label={`Preview ${mode.label}`}
                        aria-checked={isActive}
                        className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition hover:bg-white/10 sm:text-sm ${
                          isActive
                            ? "bg-white text-slate-950 shadow-sm dark:bg-card dark:text-text"
                            : "text-slate-500 hover:bg-white/70 hover:text-slate-950 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/10">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-card">
                    <p className="truncate text-sm font-semibold text-muted">{currentMode.prompt}</p>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-hover"
                      aria-label={`Generate preview for: ${currentMode.prompt}`}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_0.72fr]">
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-950 shadow-sm dark:border-white/10 dark:bg-card dark:text-text">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950 dark:text-text">AI Response</p>
                        <p className="mt-1 text-xs font-semibold text-muted">Typing generated output</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Live
                      </span>
                    </div>
                    <p className="min-h-24 whitespace-pre-line break-words text-justify text-sm leading-7 text-muted">
                      {typedOutput}
                      <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-primary align-[-0.15em]" />
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="flex min-h-[6.75rem] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary dark:text-indigo-200" aria-hidden="true" />
                          <p className="text-sm font-black text-slate-950 dark:text-white">Generated Notes</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-white/60">12 key points organized for revision.</p>
                      </div>
                      <span className="mt-3 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary dark:bg-primary/15 dark:text-indigo-100">
                        Ready
                      </span>
                    </div>
                    <button
                      type="button"
                      className="flex min-h-[6.75rem] flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-black">
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Save
                      </span>
                      <span className="text-xs font-semibold leading-5 text-slate-500 dark:text-white/60">
                        Store generated study assets in your workspace.
                      </span>
                      <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-black text-success">
                        Synced
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ["Notes", "12 key points"],
                      ["Summary", "48 sec saved"],
                      ["Quiz", "5 questions"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-white/10">
                        <p className="text-xs font-semibold text-slate-500 dark:text-white/50">{label}</p>
                        <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/10">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-500 dark:text-white/60" aria-hidden="true" />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-white/50">Recent Activity</p>
                    </div>
                    <div className="space-y-2">
                      {["Summary saved", "Quiz created"].map((item) => (
                        <div key={item} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-700 dark:text-white/80">{item}</span>
                          <span className="text-slate-400 dark:text-white/40">Now</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
