"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  History,
  Layers,
  LoaderCircle,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getSupabase } from "@/lib/supabase";
import Button from "./ui/Button";

const tourSteps = [
  {
    target: "ai-notes",
    icon: FileText,
    title: "AI Notes Generator",
    description: "Generate organized AI-powered notes from topics, lessons, and study material.",
  },
  {
    target: "quick-summary",
    icon: Layers,
    title: "Quick Summary",
    description: "Create short revision summaries when you need the main ideas fast.",
  },
  {
    target: "question-solver",
    icon: HelpCircle,
    title: "Question Solver",
    description: "Solve questions instantly and review step-by-step explanations.",
  },
  {
    target: "history",
    icon: History,
    title: "History",
    description: "Track your latest AI requests so every useful answer is easy to revisit.",
  },
  {
    target: "profile",
    icon: UserRound,
    title: "Profile",
    description: "Manage your name, avatar, and StudyAI activity from your profile page.",
  },
];

function isMissingOnboardingColumn(error) {
  const message = error?.message || "";

  return (
    message.includes("has_completed_onboarding") ||
    message.includes("schema cache") ||
    message.includes("Could not find")
  );
}

function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipStyle(rect) {
  if (typeof window === "undefined" || !rect) {
    return {};
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(420, viewportWidth - 32);

  if (viewportWidth < 640) {
    return {
      left: 16,
      right: 16,
      bottom: 20,
    };
  }

  const left = clamp(rect.left + rect.width / 2 - width / 2, 24, viewportWidth - width - 24);
  const preferredTop = rect.bottom + 18;
  const top = preferredTop > viewportHeight - 320 ? clamp(rect.top - 330, 24, viewportHeight - 340) : preferredTop;

  return {
    left,
    top,
    width,
  };
}

function WelcomeContent({ isSaving, onStart, onSkip }) {
  return (
    <>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
        Welcome to StudyAI
      </p>
      <h2 id="studyai-onboarding-title" className="mt-2 text-3xl font-black tracking-normal text-text dark:text-text">
        👋 Welcome to StudyAI
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted dark:text-muted">
        We're excited to help you study smarter with AI.
      </p>
      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-primary/10 p-4 text-left dark:border-white/10 dark:bg-background/50">
        {[
          "Generate AI-powered notes",
          "Create quick summaries",
          "Solve questions instantly",
          "Save your AI history",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm font-bold text-text dark:text-text">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary dark:text-primary" aria-hidden="true" />
            {item}
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={onStart} disabled={isSaving}>
          Let's Get Started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="secondary" onClick={onSkip} disabled={isSaving}>
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Skip Tour
        </Button>
      </div>
    </>
  );
}

function FinishContent({ isSaving, onGenerate }) {
  return (
    <>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
        You're all set
      </p>
      <h2 id="studyai-onboarding-title" className="mt-2 text-3xl font-black tracking-normal text-text dark:text-text">
        🎉 You're all set!
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted dark:text-muted">
        Start generating your first AI notes now.
      </p>
      <Button type="button" className="mt-7 w-full sm:w-auto" onClick={onGenerate} disabled={isSaving}>
        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Generate My First Notes
      </Button>
    </>
  );
}

export default function OnboardingTour() {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [phase, setPhase] = useState("loading");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [userId, setUserId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = tourSteps[currentStepIndex];
  const CurrentIcon = currentStep?.icon || Sparkles;
  const isOpen = phase === "welcome" || phase === "tour" || phase === "finish";
  const tooltipStyle = useMemo(() => getTooltipStyle(targetRect), [targetRect]);

  useEffect(() => {
    let ignore = false;

    async function loadOnboardingStatus() {
      try {
        const { supabase, user, error: userError } = await getCurrentUser();

        if (userError) throw userError;

        if (!user) {
          if (!ignore) setPhase("hidden");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("has_completed_onboarding")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          if (isMissingOnboardingColumn(profileError)) {
            if (!ignore) setPhase("hidden");
            return;
          }

          throw profileError;
        }

        if (!ignore) {
          setUserId(user.id);
          setPhase(profile?.has_completed_onboarding ? "hidden" : "welcome");
        }
      } catch (_error) {
        if (!ignore) setPhase("hidden");
      }
    }

    loadOnboardingStatus();

    function restartOnboarding(event) {
      if (event.detail?.userId) {
        setUserId(event.detail.userId);
      }

      setCurrentStepIndex(0);
      setPhase("welcome");
    }

    window.addEventListener("studyai:restart-onboarding", restartOnboarding);

    return () => {
      ignore = true;
      window.removeEventListener("studyai:restart-onboarding", restartOnboarding);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusTimer = window.setTimeout(() => {
      const focusable = getFocusableElements(dialogRef.current);
      focusable[0]?.focus();
    }, 50);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        completeOnboarding({ redirectToGenerator: false });
        return;
      }

      if (phase === "tour" && event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (phase === "tour" && event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, phase, currentStepIndex]);

  useEffect(() => {
    if (phase !== "tour" || !currentStep) {
      setTargetRect(null);
      return undefined;
    }

    let rectTimer;
    const selector = `[data-onboarding-target="${currentStep.target}"]`;

    function updateRect() {
      const target = document.querySelector(selector);

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: Math.max(rect.top - 6, 8),
        left: Math.max(rect.left - 6, 8),
        width: Math.min(rect.width + 12, window.innerWidth - 16),
        height: Math.min(rect.height + 12, window.innerHeight - 16),
        bottom: rect.bottom + 6,
      });
    }

    const target = document.querySelector(selector);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    rectTimer = window.setTimeout(updateRect, 280);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(rectTimer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [phase, currentStep]);

  async function saveOnboardingStatus(value) {
    if (!userId) return;

    const supabase = getSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({ has_completed_onboarding: value })
      .eq("id", userId);

    if (error) throw error;
  }

  async function completeOnboarding({ redirectToGenerator }) {
    setIsSaving(true);

    try {
      await saveOnboardingStatus(true);
      setPhase("hidden");

      if (redirectToGenerator) {
        router.push("/ai-notes");
      }
    } catch (_error) {
      setPhase("hidden");
    } finally {
      setIsSaving(false);
    }
  }

  function startTour() {
    setCurrentStepIndex(0);
    setPhase("tour");
  }

  async function goNext() {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex((current) => current + 1);
      return;
    }

    setIsSaving(true);

    try {
      await saveOnboardingStatus(true);
    } catch (_error) {
      // Saving onboarding progress is best-effort.
    } finally {
      setIsSaving(false);
      setPhase("finish");
    }
  }

  function goPrevious() {
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  }

  if (!isOpen) {
    return null;
  }

  if (phase === "welcome" || phase === "finish") {
    return (
      <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm studyai-fade-in sm:items-center" role="presentation">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="studyai-onboarding-title"
          className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-card/90 p-5 text-center shadow-card shadow-slate-950/20 backdrop-blur-2xl studyai-scale-in dark:bg-background/90 sm:p-7"
        >
          {phase === "welcome" ? (
            <WelcomeContent
              isSaving={isSaving}
              onStart={startTour}
              onSkip={() => completeOnboarding({ redirectToGenerator: false })}
            />
          ) : (
            <FinishContent
              isSaving={isSaving}
              onGenerate={() => completeOnboarding({ redirectToGenerator: true })}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none studyai-fade-in" aria-hidden={false}>
      {targetRect ? (
        <div
          className="fixed z-[91] rounded-[1.75rem] border border-blue-300/80 bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.72)] ring-4 ring-blue-400/25 transition-all duration-300"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="fixed inset-0 z-[91] bg-slate-950/75" aria-hidden="true" />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studyai-onboarding-title"
        className="pointer-events-auto fixed z-[92] rounded-[2rem] border border-white/20 bg-card/95 p-5 shadow-card shadow-slate-950/20 backdrop-blur-2xl studyai-scale-in dark:bg-background/95 sm:p-6"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
              <CurrentIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-primary dark:text-primary">
                Step {currentStepIndex + 1} of {tourSteps.length}
              </p>
              <h2 id="studyai-onboarding-title" className="mt-1 text-xl font-black text-text dark:text-text">
                {currentStep.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => completeOnboarding({ redirectToGenerator: false })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-text transition hover:bg-primary/15 dark:bg-white/10 dark:text-text dark:hover:bg-card/15"
            aria-label="Skip onboarding tour"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted dark:text-muted">
          {currentStep.description}
        </p>

        <div className="mt-5 flex items-center gap-2" aria-label={`Step ${currentStepIndex + 1} of ${tourSteps.length}`}>
          {tourSteps.map((step, index) => (
            <span
              key={step.target}
              className={`h-2 flex-1 rounded-full transition ${
                index <= currentStepIndex ? "bg-primary" : "bg-border dark:bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={goPrevious}
            disabled={currentStepIndex === 0 || isSaving}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => completeOnboarding({ redirectToGenerator: false })}
            disabled={isSaving}
            className="sm:justify-self-center"
          >
            Skip Tour
          </Button>
          <Button type="button" size="sm" onClick={goNext} disabled={isSaving}>
            {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {currentStepIndex === tourSteps.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
