"use client";

import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  FileText,
  History,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import OnboardingTour from "@/components/OnboardingTour";
import Toast from "@/components/Toast";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { getCurrentUser } from "@/lib/supabase";

function isMissingTableError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

async function getCount(supabase, table, userId, options = {}) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (options.allowMissing && isMissingTableError(error)) {
      return 0;
    }

    throw error;
  }

  return count || 0;
}

async function getRows(supabase, table, userId, columns, options = {}) {
  let query = supabase
    .from(table)
    .select(columns)
    .eq("user_id", userId);

  if (options.since) {
    query = query.gte("created_at", options.since.toISOString());
  }

  if (options.limit) {
    query = query.order("created_at", { ascending: false }).limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (options.allowMissing && isMissingTableError(error)) {
      return [];
    }

    throw error;
  }

  return data || [];
}

function formatRelativeDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function calculateStudyStreak(rows) {
  const activeDays = new Set(
    rows
      .filter((row) => row.created_at)
      .map((row) => getDateKey(new Date(row.created_at)))
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (activeDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

const quickActions = [
  {
    title: "Generate Notes",
    description: "Create structured study notes from any topic.",
    href: "/ai-notes",
    icon: FileText,
  },
  {
    title: "Create Quiz",
    description: "Turn saved material into quick practice questions.",
    href: "/ai-quiz",
    icon: BookOpenCheck,
  },
  {
    title: "Summarize Text",
    description: "Review long content with concise summaries.",
    href: "/ai-summary",
    icon: Layers,
  },
  {
    title: "Make Flashcards",
    description: "Convert important points into recall cards.",
    href: "/flashcards",
    icon: BrainCircuit,
  },
];

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <SkeletonCard className="h-44 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <SkeletonCard key={item} className="h-36 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <SkeletonCard key={item} className="h-40 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SkeletonCard className="h-96 rounded-3xl" />
        <SkeletonCard className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

function StatCard({ label, value, description, icon: Icon }) {
  return (
    <article className="group rounded-3xl border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow dark:bg-card/85 dark:shadow-card-dark">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted">{label}</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-text">{value}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition group-hover:-translate-y-1">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{description}</p>
    </article>
  );
}

function QuickActionCard({ action }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group rounded-3xl border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow dark:bg-card/85 dark:shadow-card-dark"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-black text-text">{action.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{action.description}</p>
    </Link>
  );
}

function NoteRow({ note, index }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="line-clamp-1 break-words font-black text-text">
            {note.title || `Generated note ${index + 1}`}
          </h3>
          <span className="shrink-0 text-xs font-bold text-muted">
            {formatRelativeDate(note.created_at)}
          </span>
        </div>
        {note.content && (
          <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted">
            {note.content}
          </p>
        )}
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Student");
  const [stats, setStats] = useState({
    notes: 0,
    savedNotes: 0,
    aiRequests: 0,
    studyStreak: 0,
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [continueNotes, setContinueNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const { supabase, user, error: userError } = await getCurrentUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError && !isMissingTableError(profileError)) {
          throw profileError;
        }

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 14);
        weekStart.setHours(0, 0, 0, 0);

        const [notesCount, aiRequestsCount, latestNotes, streakRows] = await Promise.all([
          getCount(supabase, "notes", user.id, { allowMissing: true }),
          getCount(supabase, "ai_history", user.id, { allowMissing: true }),
          getRows(supabase, "notes", user.id, "id,title,content,created_at", {
            limit: 8,
            allowMissing: true,
          }),
          Promise.all([
            getRows(supabase, "notes", user.id, "created_at", {
              since: weekStart,
              allowMissing: true,
            }),
            getRows(supabase, "summaries", user.id, "created_at", {
              since: weekStart,
              allowMissing: true,
            }),
            getRows(supabase, "questions", user.id, "created_at", {
              since: weekStart,
              allowMissing: true,
            }),
            getRows(supabase, "ai_history", user.id, "created_at", {
              since: weekStart,
              allowMissing: true,
            }),
          ]),
        ]);

        if (isMounted) {
          const name =
            profileData?.full_name?.trim() ||
            user.user_metadata?.full_name?.trim() ||
            user.email?.split("@")[0] ||
            "Student";

          setDisplayName(name);
          setStats({
            notes: notesCount,
            savedNotes: notesCount,
            aiRequests: aiRequestsCount,
            studyStreak: calculateStudyStreak(streakRows.flat()),
          });
          setRecentNotes(latestNotes.slice(0, 5));
          setContinueNotes(latestNotes.slice(0, 4));
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(dashboardError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Notes Generated",
        value: stats.notes,
        description: "AI notes created and saved in your workspace.",
        icon: FileText,
      },
      {
        label: "Saved Notes",
        value: stats.savedNotes,
        description: "Study notes ready for review and practice.",
        icon: Sparkles,
      },
      {
        label: "AI Requests",
        value: stats.aiRequests,
        description: "Tracked AI generations from your account.",
        icon: Zap,
      },
      {
        label: "Study Streak",
        value: `${stats.studyStreak}d`,
        description: "Consecutive active study days from recent activity.",
        icon: Clock3,
      },
    ],
    [stats]
  );

  return (
    <DashboardShell
      eyebrow="Dashboard"
      title="Your StudyAI workspace"
      description="A focused command center for notes, quizzes, summaries, flashcards, and study progress."
    >
      <OnboardingTour />

      <div className="mb-5">
        <Toast message={error} type="error" />
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card/85 dark:shadow-card-dark sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Welcome back
                </p>
                <h2 className="mt-4 break-words text-3xl font-black tracking-tight text-text sm:text-4xl">
                  Welcome back, {displayName}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                  Pick up where you left off, generate new study material, or
                  review your most recent notes.
                </p>
              </div>
              <Link
                href="/ai-notes"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow"
              >
                Generate Notes
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section aria-label="Dashboard stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary">
                  Quick Actions
                </p>
                <h2 className="mt-2 text-2xl font-black text-text">
                  Start a study task
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} action={action} />
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <section
              id="recent-activity"
              className="rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card/85 dark:shadow-card-dark sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                    <History className="h-4 w-4" aria-hidden="true" />
                    Recent Activity
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-text">
                    Last generated notes
                  </h2>
                </div>
                <Link href="/notes" className="text-sm font-black text-primary transition hover:text-primary-hover">
                  View all
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No generated notes yet"
                  description="Generate and save your first AI notes to see activity here."
                  action={
                    <Button as={Link} href="/ai-notes" size="sm">
                      Generate AI Notes
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                  className="mt-5"
                />
              ) : (
                <div className="mt-5 grid gap-3">
                  {recentNotes.map((note, index) => (
                    <NoteRow key={note.id} note={note} index={index} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 shadow-card dark:bg-card/85 dark:shadow-card-dark sm:p-6">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                  <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  Continue Studying
                </p>
                <h2 className="mt-2 text-2xl font-black text-text">
                  Recently opened notes
                </h2>
              </div>

              {continueNotes.length === 0 ? (
                <EmptyState
                  icon={BookOpenCheck}
                  title="Nothing to continue yet"
                  description="Your latest saved notes will appear here once you start studying."
                  action={
                    <Button as={Link} href="/notes" variant="secondary" size="sm">
                      Open Saved Notes
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                  className="mt-5"
                />
              ) : (
                <div className="mt-5 grid gap-3">
                  {continueNotes.map((note, index) => (
                    <Link
                      key={note.id}
                      href="/notes"
                      className="group rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 break-words font-black text-text">
                            {note.title || `Study note ${index + 1}`}
                          </h3>
                          <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted">
                            {note.content || "Open this saved note to continue reviewing."}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                      </div>
                      <p className="mt-4 text-xs font-bold text-muted">
                        Last updated {formatRelativeDate(note.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
