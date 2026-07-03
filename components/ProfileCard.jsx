import { CalendarDays, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Avatar from "./ui/Avatar";
import Surface from "./ui/Surface";

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProfileCard({ profile, email }) {
  const fullName = profile?.full_name || "StudyAI Student";
  const avatarUrl = profile?.avatar_url;
  const role = profile?.role === "admin" ? "Admin" : "User";

  return (
    <Surface as="article" padding="none" className="overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-primary via-primary-hover to-violet-600" />
      <div className="-mt-12 p-5 sm:p-6">
        <Avatar
          src={avatarUrl}
          name={fullName}
          email={email}
          size="lg"
          className="h-24 w-24 border-4 border-card text-2xl shadow-lg dark:border-card"
        />

        <div className="mt-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary-hover dark:bg-primary/15 dark:text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            StudyAI {role}
          </p>
          <h2 className="mt-3 break-words text-3xl font-bold tracking-normal text-text dark:text-text">
            {fullName}
          </h2>
          {profile?.bio && (
            <p className="mt-3 max-w-xl break-words text-sm leading-6 text-muted">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 dark:border-border dark:bg-sidebar">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm dark:bg-card dark:text-primary">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-muted">
                Email Address
              </p>
              <p className="mt-1 break-words text-sm font-bold text-text dark:text-text">
                {email || profile?.email || "Not available"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 dark:border-border dark:bg-sidebar">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm dark:bg-card dark:text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-muted">
                Role
              </p>
              <p className="mt-1 text-sm font-bold text-text dark:text-text">
                {role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 dark:border-border dark:bg-sidebar">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm dark:bg-card dark:text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-muted">
                Join Date
              </p>
              <p className="mt-1 text-sm font-bold text-text dark:text-text">
                {formatDate(profile?.created_at)}
              </p>
            </div>
          </div>

          {!profile?.bio && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-4 dark:border-border dark:bg-sidebar">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-muted shadow-sm dark:bg-card">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Bio
                </p>
                <p className="mt-1 text-sm font-semibold text-muted">
                  Add a short study bio from the edit form.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
}
