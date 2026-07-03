import {
  ArrowRight,
  AtSign,
  Globe,
  Mail,
  PlayCircle,
  Send,
  Sparkles,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const footerColumns = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "#home" },
      { label: "AI Workspace", href: "#workspace" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Features",
    links: [
      { label: "AI Notes", href: "#ai-notes" },
      { label: "Quick Summary", href: "#features" },
      { label: "Quiz Generator", href: "#features" },
      { label: "Question Solver", href: "#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Saved Notes", href: "/notes" },
      { label: "Study Planner", href: "/planner" },
      { label: "Support", href: "mailto:hello@studyai.com" },
    ],
  },
];

const socialLinks = [
  { label: "Website", href: "#home", icon: Globe },
  { label: "Community", href: "#features", icon: AtSign },
  { label: "Updates", href: "#contact", icon: Send },
  { label: "Email", href: "mailto:hello@studyai.com", icon: Mail },
];

export default function Footer() {
  return (
    <>
      <section
        id="contact"
        className="landing-cta-shell relative isolate overflow-hidden bg-gradient-to-b from-background to-card py-16 transition-colors duration-300 dark:from-slate-950 dark:to-background sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute -left-36 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="pointer-events-none absolute right-[-8rem] bottom-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/30 bg-gradient-to-br from-primary via-primary-hover to-violet-600 px-5 py-14 text-center shadow-glow transition-colors duration-300 dark:border-white/10 sm:px-10 sm:py-16 lg:px-16">
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              <div className="relative mx-auto max-w-3xl">
                <p className="mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/90 shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Your AI study partner is ready
                </p>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Ready to Study Smarter?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-indigo-50/90">
                  Generate notes, summaries, quizzes, and practice questions in
                  seconds so every study session feels clearer and more focused.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#ai-notes"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-black text-primary-hover shadow-sm transition hover:-translate-y-1 hover:bg-indigo-50 hover:shadow-glow sm:w-auto"
                  >
                    Start Free Today
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </a>
                  <a
                    href="#workspace"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3 text-base font-black text-white shadow-sm backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 sm:w-auto"
                  >
                    <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    See Demo
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t border-border bg-card text-text shadow-soft transition-colors duration-300 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:shadow-none">
        <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="pointer-events-none absolute right-[-10rem] bottom-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
            <div className="max-w-md">
              <a href="#home" className="inline-flex items-center gap-3 rounded-2xl">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-colors duration-300">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xl font-black tracking-tight">StudyAI</span>
              </a>

              <p className="mt-5 text-sm leading-7 text-muted transition-colors duration-300 dark:text-slate-400">
                StudyAI helps students create notes, summaries, quizzes,
                flashcards, and practice questions from any topic in seconds.
              </p>

              <a
                href="mailto:hello@studyai.com"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors duration-300 hover:text-primary-hover dark:text-slate-300 dark:hover:text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                hello@studyai.com
              </a>

              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:shadow-none dark:hover:border-primary/50 dark:hover:bg-primary dark:hover:text-white"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-black uppercase tracking-wide text-text transition-colors duration-300 dark:text-white">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-sm font-semibold text-muted transition-colors duration-300 hover:text-primary dark:text-slate-400 dark:hover:text-white"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted transition-colors duration-300 dark:border-white/10 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 StudyAI. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="mailto:hello@studyai.com?subject=StudyAI%20Privacy%20Policy" className="font-semibold transition-colors duration-300 hover:text-primary dark:hover:text-white">
                Privacy
              </a>
              <a href="mailto:hello@studyai.com?subject=StudyAI%20Terms%20of%20Service" className="font-semibold transition-colors duration-300 hover:text-primary dark:hover:text-white">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
