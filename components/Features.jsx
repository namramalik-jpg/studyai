"use client";

import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  MessageCircleQuestion,
  Sparkles,
  Zap,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const features = [
  {
    icon: FileText,
    title: "AI Notes",
    tool: "notes",
    label: "Structured learning",
    description:
      "Turn any topic into organized notes with definitions, examples, key points, and exam-ready revision flow.",
    accent: "from-indigo-500/18 to-sky-500/10",
    iconTone: "bg-indigo-500/10 text-primary",
    preview: ["Key definitions", "Core examples", "Revision bullets"],
  },
  {
    icon: Zap,
    title: "Quick Summary",
    tool: "summary",
    label: "Faster review",
    description:
      "Compress long chapters, articles, and pasted text into clean summaries that are easy to scan.",
    accent: "from-amber-400/18 to-indigo-500/10",
    iconTone: "bg-amber-400/10 text-warning",
    preview: ["Main idea", "Important terms", "Takeaway"],
  },
  {
    icon: MessageCircleQuestion,
    title: "Question Solver",
    tool: "question",
    label: "Step-by-step help",
    description:
      "Solve study questions with a clear method, simple explanations, and reasoning you can actually follow.",
    accent: "from-emerald-400/18 to-indigo-500/10",
    iconTone: "bg-emerald-400/10 text-success",
    preview: ["Given data", "Solution steps", "Final answer"],
  },
  {
    icon: BookOpenCheck,
    title: "Smart Quiz Generator",
    tool: "notes",
    label: "Practice mode",
    description:
      "Create quizzes from your notes so you can test recall, spot weak areas, and prepare with confidence.",
    accent: "from-violet-500/18 to-fuchsia-500/10",
    iconTone: "bg-violet-500/10 text-violet-500",
    preview: ["MCQs", "Short answers", "Answer key"],
  },
];

export default function Features() {
  function openTool(tool) {
    window.dispatchEvent(
      new CustomEvent("studyai:set-tool-mode", {
        detail: { tool },
      })
    );
  }

  return (
    <section
      id="features"
      className="landing-section landing-section-alt"
    >
      <div className="landing-hairline" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_68%)] blur-sm" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-sm" />

      <div className="landing-container">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Premium AI study tools
          </p>
          <h2 className="landing-title mt-5">
            Four ways to study smarter
          </h2>
          <p className="landing-subtitle">
            A focused toolkit for turning messy material into notes, summaries,
            solved questions, and practice quizzes.
          </p>
        </ScrollReveal>

        <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const delayClass =
              index === 1 ? "delay-100" : index === 2 ? "delay-200" : index === 3 ? "delay-300" : "";

            return (
              <ScrollReveal key={feature.title} delay={delayClass}>
                <a
                  href="#ai-notes"
                  onClick={() => openTool(feature.tool)}
                  aria-label={`Open ${feature.title}`}
                  className="landing-card landing-card-hover group relative flex h-full min-h-[25rem] flex-col overflow-hidden p-5"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent} opacity-80 transition duration-300 group-hover:opacity-100`}
                  />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition duration-300 group-hover:bg-primary/20" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border ${feature.iconTone} shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:scale-105`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-bold text-muted shadow-sm backdrop-blur">
                        {feature.label}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-black tracking-tight text-text">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {feature.description}
                    </p>
                  </div>

                  <div className="relative mt-6 rounded-2xl border border-border bg-surface/70 p-3 transition duration-300 group-hover:bg-surface">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                    </div>
                    <div className="space-y-2">
                      {feature.preview.map((item, itemIndex) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-xl border border-border bg-card/75 px-3 py-2 text-xs font-semibold text-muted shadow-sm"
                        >
                          <span className={`h-1.5 rounded-full bg-primary ${itemIndex === 0 ? "w-8" : itemIndex === 1 ? "w-5" : "w-3"}`} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-auto flex items-center justify-between pt-6">
                    <span className="text-sm font-black text-primary">Open tool</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm transition duration-300 group-hover:translate-x-1 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
