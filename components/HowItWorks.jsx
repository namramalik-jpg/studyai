import { BookOpenCheck, Keyboard, Sparkles, WandSparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    number: "01",
    icon: Keyboard,
    title: "Enter Topic",
    description:
      "Type a subject, paste your notes, or add a question you want to understand better.",
  },
  {
    number: "02",
    icon: WandSparkles,
    title: "AI Generates Notes",
    description:
      "StudyAI turns your input into clean notes, summaries, explanations, and quiz-ready material.",
  },
  {
    number: "03",
    icon: BookOpenCheck,
    title: "Study & Practice",
    description:
      "Review the output, save what matters, and practice until the topic feels clear.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="landing-section landing-section-alt">
      <div className="pointer-events-none absolute -left-44 top-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-12rem] bottom-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="landing-hairline" />

      <div className="landing-container">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            How it works
          </p>
          <h2 className="landing-title mt-5">
            From idea to study-ready material
          </h2>
          <p className="landing-subtitle">
            A simple three-step flow that helps students move from a rough topic
            to clear notes and practice material in seconds.
          </p>
        </ScrollReveal>

        <div className="relative mt-14">
          <div
            className="absolute left-6 top-10 h-[calc(100%-5rem)] w-px bg-gradient-to-b from-primary/40 via-border to-primary/20 lg:left-0 lg:right-0 lg:top-1/2 lg:mx-auto lg:h-px lg:w-[72%] lg:-translate-y-1/2 lg:bg-gradient-to-r"
            aria-hidden="true"
          />

          <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const delayClass = index === 1 ? "delay-100" : index === 2 ? "delay-200" : "";

              return (
                <ScrollReveal key={step.number} delay={delayClass} className="h-full">
                  <article className="group relative h-full pl-16 lg:pl-0">
                    <div className="landing-card landing-card-hover relative h-full overflow-hidden p-6">
                      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl transition duration-300 group-hover:bg-primary/15" />
                      <div className="relative flex h-full flex-col items-center text-center">
                        <div className="landing-icon-tile transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <span className="mt-5 text-5xl font-black leading-none tracking-tight text-slate-500 transition duration-300 group-hover:text-slate-600 dark:text-slate-100 dark:group-hover:text-indigo-100">
                          {step.number}
                        </span>
                        <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                          {step.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {index < steps.length - 1 ? (
                      <div className="absolute left-5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-sm lg:left-auto lg:right-[-1.55rem]">
                        <span className="text-lg font-black leading-none lg:hidden">↓</span>
                        <span className="hidden text-lg font-black leading-none lg:inline">→</span>
                      </div>
                    ) : null}
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
