"use client";

import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  MessageSquareText,
  MoreHorizontal,
  PanelLeft,
  Radio,
  Search,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import ScrollReveal from "./ScrollReveal";

const typedText =
  "Photosynthesis is the process plants use to convert sunlight into chemical energy. It happens in chloroplasts, uses carbon dioxide and water, and produces glucose plus oxygen.";

const workspaceTabs = [
  { label: "Notes", icon: FileText },
  { label: "Summary", icon: Layers3 },
  { label: "Quiz", icon: BookOpenCheck },
];

const notePoints = [
  "Light energy is captured by chlorophyll.",
  "Carbon dioxide enters through tiny leaf openings.",
  "Glucose stores energy for plant growth.",
];

const sideCards = [
  {
    title: "Summary",
    label: "42 sec read",
    icon: Layers3,
    className: "bg-indigo-50 text-primary border-indigo-100",
    content: "Plants turn sunlight into stored food energy.",
  },
  {
    title: "Quiz Ready",
    label: "8 questions",
    icon: BookOpenCheck,
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    content: "Multiple choice and short-answer practice.",
  },
  {
    title: "Flashcards",
    label: "12 cards",
    icon: Zap,
    className: "bg-amber-50 text-amber-700 border-amber-100",
    content: "Key terms converted into recall cards.",
  },
  {
    title: "Practice Questions",
    label: "Adaptive",
    icon: MessageSquareText,
    className: "bg-violet-50 text-violet-700 border-violet-100",
    content: "Follow-up questions based on weak areas.",
  },
];

export default function AIWorkspaceShowcase() {
  const [typedOutput, setTypedOutput] = useState("");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setTypedOutput(typedText);
      return undefined;
    }

    let index = 0;
    setTypedOutput("");

    const timer = setInterval(() => {
      index += 3;
      setTypedOutput(typedText.slice(0, index));

      if (index >= typedText.length) {
        clearInterval(timer);
      }
    }, 24);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="workspace"
      className="landing-section"
    >
      <div className="pointer-events-none absolute left-[-12rem] top-4 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.13)_0%,rgba(99,102,241,0.06)_38%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-10rem] top-28 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.13)_0%,rgba(99,102,241,0.05)_38%,transparent_72%)] blur-sm" />
      <div className="pointer-events-none absolute left-[12%] bottom-20 h-24 w-24 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute right-[18%] top-16 h-20 w-20 rounded-full bg-violet-400/10 blur-3xl animate-pulse-glow" />
      <div className="landing-hairline" />

      <div className="landing-container">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            AI Workspace
          </p>
          <h2 className="landing-title mt-5">
            One intelligent workspace for every study task
          </h2>
          <p className="landing-subtitle">
            Prompt once and watch StudyAI organize your topic into notes,
            summaries, quizzes, flashcards, and practice questions.
          </p>
        </ScrollReveal>

        <ScrollReveal delay="delay-150" className="mx-auto mt-12 max-w-6xl">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,rgba(139,92,246,0.11)_38%,transparent_72%)] blur-2xl" />

            <div className="landing-card relative overflow-hidden shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 sm:flex">
                  <Radio className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  Live generation
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="More workspace actions"
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid min-h-[34rem] lg:grid-cols-[14rem_1fr_18rem]">
                <aside className="border-b border-slate-200 bg-slate-50/80 p-4 lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">StudyAI</p>
                      <p className="text-xs font-semibold text-slate-500">Workspace</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-2">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      <Search className="h-4 w-4" aria-hidden="true" />
                      Search notes
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {workspaceTabs.map((tab, index) => {
                      const Icon = tab.icon;
                      const isActive = index === 0;

                      return (
                        <div
                          key={tab.label}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-500 hover:bg-white hover:text-primary"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {tab.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                      <PanelLeft className="h-4 w-4" aria-hidden="true" />
                      Today
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
                      6 study assets generated from one topic.
                    </p>
                  </div>
                </aside>

                <div className="bg-white p-4 sm:p-5 lg:p-6">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Prompt Input
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                          Create study notes about photosynthesis for class 10 biology.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="landing-button-primary min-h-10 px-4 py-2"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.78fr]">
                    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.07)]">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                            Generated Notes
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Clean structure with exam-focused points
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Typing
                        </span>
                      </div>

                      <p className="min-h-28 text-justify text-sm leading-7 text-slate-600">
                        {typedOutput}
                        <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-primary align-[-0.15em]" />
                      </p>

                      <div className="mt-5 space-y-3">
                        {notePoints.map((point) => (
                          <div
                            key={point}
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                            <p className="text-sm font-semibold leading-6 text-slate-700">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_16px_45px_rgba(15,23,42,0.16)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">AI Status</p>
                            <p className="mt-1 text-xs font-semibold text-white/50">
                              Workspace sync active
                            </p>
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-emerald-200">
                            Online
                          </span>
                        </div>
                        <div className="mt-5 grid w-full grid-cols-[repeat(3,minmax(0,1fr))] items-stretch gap-1.5 overflow-hidden sm:gap-2">
                          {["Notes", "Quiz", "Cards"].map((item) => (
                            <div
                              key={item}
                              className="flex min-h-20 w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 px-1.5 py-3 text-center sm:px-2 sm:py-4"
                            >
                              <p className="max-w-full whitespace-nowrap text-center text-[0.68rem] font-semibold leading-tight text-white/45 sm:text-[0.72rem]">
                                {item}
                              </p>
                              <p className="mt-2 max-w-full whitespace-nowrap text-center text-[0.82rem] font-black leading-tight tracking-tight sm:text-sm">
                                Ready
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.07)]">
                        <div className="mb-4 flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                          <p className="text-sm font-black text-slate-950">Recent Activity</p>
                        </div>
                        <div className="space-y-3">
                          {["Summary generated", "Flashcards created", "Quiz exported"].map((activity) => (
                            <div key={activity} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-semibold text-slate-600">{activity}</span>
                              <span className="text-xs font-bold text-slate-400">Now</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="grid gap-4 border-t border-slate-200 bg-slate-50/80 p-4 lg:border-l lg:border-t-0">
                  {sideCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.title}
                        className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(99,102,241,0.12)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.className}`}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                            {card.label}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-black text-slate-950">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.content}</p>
                      </div>
                    );
                  })}
                </aside>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
