"use client";

import {
  Activity,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Eye,
  FileText,
  Layers,
  LoaderCircle,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StatsCard from "./StatsCard";
import Toast from "./Toast";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Input from "./ui/Input";
import { SkeletonCard } from "./ui/Skeleton";
import Surface from "./ui/Surface";
import { getCurrentUserRole, getSupabase } from "@/lib/supabase";

const statCards = [
  { key: "users", label: "Total Users", description: "Registered accounts", icon: UsersRound },
  { key: "notes", label: "Total AI Notes Generated", description: "Saved notes", icon: FileText },
  { key: "summaries", label: "Total AI Summaries", description: "Saved summaries", icon: Layers },
  { key: "quizzes", label: "Total AI Quizzes", description: "Quiz attempts", icon: BookOpenCheck },
  { key: "flashcardDecks", label: "Total Flashcard Decks", description: "Generated decks", icon: BrainCircuit },
  { key: "savedNotes", label: "Total Saved Notes", description: "All saved study assets", icon: Sparkles },
  { key: "aiRequests", label: "Total AI Requests", description: "Gemini generations", icon: Activity },
];

const adminActionButtonClass =
  "min-w-[7rem] whitespace-nowrap break-normal px-4 [overflow-wrap:normal]";
const adminRoleActionButtonClass =
  "min-w-[11.25rem] whitespace-nowrap break-normal px-4 [overflow-wrap:normal]";

function isMissingSchemaError(error) {
  const message = error?.message || "";

  return (
    message.includes("Could not find") ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("role")
  );
}

async function getTableCount(supabase, table, options = {}) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  if (options.since) {
    query = query.gte("created_at", options.since.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    if (options.allowMissing && isMissingSchemaError(error)) return 0;
    throw error;
  }

  return count || 0;
}

async function getRows(supabase, table, columns, options = {}) {
  let query = supabase.from(table).select(columns);

  if (options.since) {
    query = query.gte("created_at", options.since.toISOString());
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: Boolean(options.ascending) });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (options.allowMissing && isMissingSchemaError(error)) return [];
    throw error;
  }

  return data || [];
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekBuckets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: getDateKey(date),
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      value: 0,
    };
  });
}

function aggregateDaily(rows, buckets, uniqueUser = false) {
  const counts = new Map(buckets.map((bucket) => [bucket.key, uniqueUser ? new Set() : 0]));

  rows.forEach((row) => {
    const key = getDateKey(new Date(row.created_at));

    if (!counts.has(key)) return;

    if (uniqueUser) {
      counts.get(key).add(row.user_id || row.id);
      return;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return buckets.map((bucket) => ({
    ...bucket,
    value: uniqueUser ? counts.get(bucket.key).size : counts.get(bucket.key) || 0,
  }));
}

function normalizeFeature(feature = "") {
  const clean = String(feature).toLowerCase();

  if (clean.includes("summary")) return "Summary";
  if (clean.includes("quiz") || clean.includes("question")) return "Quiz";
  if (clean.includes("flash")) return "Flashcards";
  if (clean.includes("note")) return "Notes";

  return "Other";
}

function getMostUsedFeature(rows) {
  const counts = rows.reduce((map, row) => {
    const feature = normalizeFeature(row.feature);
    map.set(feature, (map.get(feature) || 0) + 1);
    return map;
  }, new Map());

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return sorted[0]
    ? { label: sorted[0][0], value: sorted[0][1] }
    : { label: "No data", value: 0 };
}

function AdminSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonCard key={item} className="h-36" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>
      <SkeletonCard className="h-96" />
    </div>
  );
}

function BarChart({ title, description, items, horizontal = false }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const hasData = items.some((item) => item.value > 0);

  return (
    <Surface>
      <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-primary">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        Analytics
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-text">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      {!hasData ? (
        <EmptyState
          icon={Activity}
          title="No chart data yet"
          description="This chart is ready and will populate when users create activity."
          className="mt-5 px-4 py-10"
        />
      ) : horizontal ? (
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm font-black">
                <span className="text-text">{item.label}</span>
                <span className="text-muted">{item.value}</span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-surface"
                role="progressbar"
                aria-label={`${item.label} total`}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-valuenow={item.value}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 flex h-56 items-end gap-2 rounded-2xl border border-border bg-surface px-3 pb-4 pt-6 sm:gap-3 sm:px-4" role="img" aria-label={`${title} bar chart`}>
            {items.map((item) => (
              <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-black text-muted">{item.value}</span>
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full max-w-10 rounded-t-xl bg-primary shadow-sm transition-all duration-500"
                    style={{
                      height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted">
            {items.map((item) => (
              <span key={item.label} className="truncate">
                {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </Surface>
  );
}

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow dark:shadow-card-dark">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-sm font-bold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-black text-text">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{description}</p>
    </article>
  );
}

function UserProfileModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={user.avatar_url} name={user.full_name} email={user.email} size="lg" />
            <div className="min-w-0">
              <h2 id="admin-profile-title" className="break-words text-2xl font-black text-text">
                {user.full_name || "StudyAI User"}
              </h2>
              <p className="mt-1 break-words text-sm font-semibold text-muted">{user.email || "No email"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-text"
            aria-label="Close user profile"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <MetricCard icon={ShieldCheck} label="Role" value={user.role || "user"} description="Access level" />
          <MetricCard icon={CalendarDays} label="Joined" value={formatDate(user.created_at)} description="Profile created" />
          <MetricCard icon={Activity} label="Last Login" value={formatDate(user.last_login)} description="Supabase Auth" />
          <MetricCard
            icon={Sparkles}
            label="Email"
            value={user.email_confirmed_at ? "Verified" : "Pending"}
            description="Email confirmation"
          />
        </div>
      </div>
    </div>
  );
}

function DeleteUserModal({ user, isWorking, onCancel, onConfirm }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="delete-user-title" className="text-2xl font-black text-text">Delete user?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This permanently deletes {user.email || user.full_name || "this user"} and their StudyAI data. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isWorking}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isWorking}>
            {isWorking ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-card dark:border-red-400/20 dark:bg-red-400/10">
      <ShieldAlert className="mx-auto h-10 w-10 text-red-600 dark:text-red-200" />
      <h2 className="mt-4 text-2xl font-black text-red-800 dark:text-red-100">Admin access required</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700 dark:text-red-200">
        This page is protected. Only users with role = admin in the profiles table can view it.
      </p>
    </section>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    notes: 0,
    summaries: 0,
    quizzes: 0,
    flashcardDecks: 0,
    savedNotes: 0,
    aiRequests: 0,
  });
  const [analytics, setAnalytics] = useState({
    dailyActiveUsers: [],
    aiRequestsPerDay: [],
    contentBreakdown: [],
    mostUsedFeature: { label: "No data", value: 0 },
    newUsersThisWeek: 0,
    userGrowth: [],
  });
  const [users, setUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewingUser, setViewingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    return users
      .filter((user) => roleFilter === "all" || user.role === roleFilter)
      .filter((user) => {
        if (!cleanQuery) return true;

        return [user.full_name, user.email].join(" ").toLowerCase().includes(cleanQuery);
      })
      .sort((first, second) => {
        const firstTime = new Date(first.created_at || 0).getTime();
        const secondTime = new Date(second.created_at || 0).getTime();

        return sortOrder === "oldest" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [roleFilter, searchQuery, sortOrder, users]);

  useEffect(() => {
    loadAdminDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message && !error) return undefined;

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  async function getAdminToken() {
    const supabase = getSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Your admin session expired. Please log in again.");
    }

    return token;
  }

  async function fetchAdminUsers() {
    const token = await getAdminToken();
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Could not load users.");
    }

    return payload.users || [];
  }

  async function loadAdminDashboard() {
    setIsLoading(true);
    setIsRedirecting(false);
    setError("");

    try {
      const {
        supabase,
        user: authUser,
        role,
        error: roleError,
      } = await getCurrentUserRole();

      if (!authUser) {
        setIsRedirecting(true);
        router.replace("/login");
        return;
      }

      if (roleError) throw roleError;

      if (role !== "admin") {
        setCurrentUser(authUser);
        setIsAdmin(false);
        setIsRedirecting(true);
        router.replace("/dashboard");
        return;
      }

      setCurrentUser(authUser);
      setIsAdmin(true);

      const buckets = getWeekBuckets();
      const weekStart = new Date(buckets[0].key);
      const [adminUsers, usersCount, aiRequests, notes, summaries, quizzes, flashcardDecks, weeklyAiRows, weeklyProfiles, recentProfiles, recentNotes, recentQuizzes, recentFlashcards] = await Promise.all([
        fetchAdminUsers(),
        getTableCount(supabase, "profiles", { allowMissing: true }),
        getTableCount(supabase, "ai_history", { allowMissing: true }),
        getTableCount(supabase, "notes", { allowMissing: true }),
        getTableCount(supabase, "summaries", { allowMissing: true }),
        getTableCount(supabase, "quiz_history", { allowMissing: true }),
        getTableCount(supabase, "flashcard_decks", { allowMissing: true }),
        getRows(supabase, "ai_history", "id,user_id,feature,created_at", {
          since: weekStart,
          allowMissing: true,
        }),
        getRows(supabase, "profiles", "id,full_name,email,created_at", {
          since: weekStart,
          allowMissing: true,
        }),
        getRows(supabase, "profiles", "id,full_name,email,created_at", {
          orderBy: "created_at",
          ascending: false,
          limit: 5,
          allowMissing: true,
        }),
        getRows(supabase, "notes", "id,user_id,title,created_at", {
          orderBy: "created_at",
          ascending: false,
          limit: 5,
          allowMissing: true,
        }),
        getRows(supabase, "quiz_history", "id,user_id,topic,created_at", {
          orderBy: "created_at",
          ascending: false,
          limit: 5,
          allowMissing: true,
        }),
        getRows(supabase, "flashcard_decks", "id,user_id,topic,created_at", {
          orderBy: "created_at",
          ascending: false,
          limit: 5,
          allowMissing: true,
        }),
      ]);

      const savedNotes = notes + summaries + quizzes + flashcardDecks;
      const newUsersThisWeek = weeklyProfiles.length;
      const recentItems = [
        ...recentProfiles.map((row) => ({
          id: `signup-${row.id}`,
          type: "New Signup",
          title: row.full_name || row.email || "New user",
          description: "Joined StudyAI",
          created_at: row.created_at,
        })),
        ...recentNotes.map((row) => ({
          id: `note-${row.id}`,
          type: "Notes Generated",
          title: row.title || "AI note",
          description: "Saved an AI note",
          created_at: row.created_at,
        })),
        ...recentQuizzes.map((row) => ({
          id: `quiz-${row.id}`,
          type: "Quiz Completed",
          title: row.topic || "AI quiz",
          description: "Completed or saved a quiz",
          created_at: row.created_at,
        })),
        ...recentFlashcards.map((row) => ({
          id: `flashcards-${row.id}`,
          type: "Flashcards Created",
          title: row.topic || "Flashcard deck",
          description: "Created flashcards",
          created_at: row.created_at,
        })),
      ]
        .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
        .slice(0, 8);

      setStats({
        users: usersCount,
        notes,
        summaries,
        quizzes,
        flashcardDecks,
        savedNotes,
        aiRequests,
      });
      setAnalytics({
        dailyActiveUsers: aggregateDaily(weeklyAiRows, buckets, true),
        aiRequestsPerDay: aggregateDaily(weeklyAiRows, buckets),
        contentBreakdown: [
          { label: "Notes", value: notes },
          { label: "Summaries", value: summaries },
          { label: "Quizzes", value: quizzes },
          { label: "Flashcards", value: flashcardDecks },
        ],
        mostUsedFeature: getMostUsedFeature(weeklyAiRows),
        newUsersThisWeek,
        userGrowth: aggregateDaily(weeklyProfiles, buckets),
      });
      setUsers(adminUsers);
      setRecentActivity(recentItems);
    } catch (loadError) {
      setError(
        isMissingSchemaError(loadError)
          ? "Admin schema is not ready. Make sure profiles.role exists and your account role is set to admin."
          : loadError.message || "Could not load admin dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(profile, nextRole) {
    if (!currentUser || profile.id === currentUser.id) return;

    setUpdatingUserId(profile.id);
    setError("");
    setMessage("");

    try {
      const token = await getAdminToken();
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: profile.id, role: nextRole }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not update role.");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === profile.id ? { ...user, role: payload.user.role } : user
        )
      );
      setMessage(`User role updated to ${nextRole}.`);
    } catch (roleError) {
      setError(roleError.message || "Could not update user role.");
    } finally {
      setUpdatingUserId("");
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;

    setDeletingUserId(deleteTarget.id);
    setError("");
    setMessage("");

    try {
      const token = await getAdminToken();
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete user.");
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== deleteTarget.id));
      setStats((currentStats) => ({
        ...currentStats,
        users: Math.max(currentStats.users - 1, 0),
      }));
      setMessage("User deleted successfully.");
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete user.");
    } finally {
      setDeletingUserId("");
    }
  }

  if (isLoading || isRedirecting) {
    return <AdminSkeleton />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <>
      <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />
      <DeleteUserModal
        user={deleteTarget}
        isWorking={deletingUserId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
      />

      <div className="grid gap-5">
        <div className="grid gap-3">
          <Toast message={message} />
          <Toast message={error} type="error" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatsCard
              key={card.key}
              label={card.label}
              value={stats[card.key]}
              description={card.description}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={Activity}
            label="Daily Active Users"
            value={analytics.dailyActiveUsers.at(-1)?.value || 0}
            description="Unique users today"
          />
          <MetricCard
            icon={TrendingUp}
            label="Most Used AI Feature"
            value={analytics.mostUsedFeature.label}
            description={`${analytics.mostUsedFeature.value} uses this week`}
          />
          <MetricCard
            icon={UsersRound}
            label="New Users This Week"
            value={analytics.newUsersThisWeek}
            description="Based on profile creation"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <BarChart
            title="AI Requests per Day"
            description="Gemini usage across the last seven days."
            items={analytics.aiRequestsPerDay}
          />
          <BarChart
            title="User Growth"
            description="New registered users across the last seven days."
            items={analytics.userGrowth}
          />
          <BarChart
            title="Daily Active Users"
            description="Unique users who generated AI activity each day."
            items={analytics.dailyActiveUsers}
          />
          <BarChart
            title="Content Breakdown"
            description="Saved content totals by feature."
            items={analytics.contentBreakdown}
            horizontal
          />
        </div>

        <Surface padding="none" className="overflow-hidden">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  User Management
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-text">Registered Users</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Search users, view profiles, change roles, and delete accounts with confirmation.
                </p>
              </div>
              <Button type="button" onClick={loadAdminDashboard}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
              <Input
                icon={Search}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or email..."
                aria-label="Search users"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 lg:w-40"
                aria-label="Filter users by role"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 lg:w-40"
                aria-label="Sort users"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No users found"
              description="Try a different search or role filter."
              className="mx-5 my-6 px-4 py-12 sm:mx-6"
            />
          ) : (
            <div className="overflow-x-auto study-scrollbar">
              <table className="min-w-[76rem] divide-y divide-border">
                <thead className="bg-surface">
                  <tr>
                    {["User", "Role", "Joined Date", "Last Login", "Actions"].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-3 text-xs font-black uppercase tracking-wide text-muted ${
                          heading === "Actions" ? "w-[28rem] text-right" : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((profile) => {
                    const isCurrentUser = profile.id === currentUser?.id;
                    const nextRole = profile.role === "admin" ? "user" : "admin";

                    return (
                      <tr key={profile.id} className="transition hover:bg-primary/10">
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar src={profile.avatar_url} name={profile.full_name} email={profile.email} />
                            <div className="min-w-0">
                              <p className="break-words text-sm font-black text-text">
                                {profile.full_name || "StudyAI User"}
                              </p>
                              <p className="mt-1 break-words text-xs font-semibold text-muted">
                                {profile.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={profile.role === "admin" ? "primary" : "neutral"}>
                            {profile.role || "user"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-muted">
                          {formatDate(profile.created_at)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-muted">
                          {formatDate(profile.last_login)}
                        </td>
                        <td className="w-[28rem] px-5 py-4">
                          <div className="flex min-w-[26rem] justify-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setViewingUser(profile)}
                              className={adminActionButtonClass}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => updateUserRole(profile, nextRole)}
                              disabled={isCurrentUser || updatingUserId === profile.id}
                              className={adminRoleActionButtonClass}
                            >
                              {updatingUserId === profile.id ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <UserCog className="h-4 w-4" aria-hidden="true" />
                              )}
                              {isCurrentUser ? "Current Admin" : profile.role === "admin" ? "Set User" : "Make Admin"}
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget(profile)}
                              disabled={isCurrentUser || deletingUserId === profile.id}
                              className={adminActionButtonClass}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Surface>

        <Surface className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-text">Recent Activity</h2>
              <p className="mt-1 text-sm leading-6 text-muted">New signups and latest generated study content.</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Activity appears here when users sign up or generate content."
              className="mt-5"
            />
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {recentActivity.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-primary/35">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge>{item.type}</Badge>
                      <h3 className="mt-3 break-words text-base font-black text-text">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-xs font-bold text-muted">{formatDate(item.created_at)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </>
  );
}
