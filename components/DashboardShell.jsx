"use client";

import { ChevronDown, Command, LogOut, Moon, Search, Settings, Sparkles, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { getCurrentUser, getSupabase } from "@/lib/supabase";
import { suppressThemeTransitions } from "@/lib/themeTransition";
import AIFeatureTabs from "./AIFeatureTabs";
import NotificationCenter from "./NotificationCenter";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "./Sidebar";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function DashboardShell({ children, eyebrow, title, description }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setIsThemeMounted(true);

    let ignore = false;

    async function loadUser() {
      const { supabase, user: currentUser } = await getCurrentUser();

      if (!currentUser) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name,email,avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!ignore) {
        setUser(currentUser);
        setProfile(profileData);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function handleMenuClose(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("keydown", handleMenuClose);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleMenuClose);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function toggleTheme() {
    if (!isThemeMounted) return;

    suppressThemeTransitions();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <ProtectedRoute>
      <main className="min-h-screen overflow-x-hidden bg-background text-text lg:flex">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-xl bg-primary px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Sidebar />
        <section id="main-content" className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6" aria-labelledby="page-title">
          <div className="mx-auto w-full max-w-7xl">
            <header className="sticky top-3 z-30 mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-card/85 p-3 shadow-card backdrop-blur-xl studyai-slide-up dark:bg-card/75 dark:shadow-card-dark lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-primary sm:flex">
                    <Command className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-text">
                      Welcome, {displayName}
                    </p>
                    <p className="truncate text-xs font-semibold text-muted">
                      Ready for a focused study session?
                    </p>
                  </div>
                </div>
                <Input
                  icon={Search}
                  placeholder="Search notes, summaries, questions..."
                  aria-label="Search StudyAI workspace"
                  className="lg:max-w-xl"
                />
              </div>
              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <Button type="button" variant="secondary" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                  {!isThemeMounted ? (
                    <span className="h-5 w-5" aria-hidden="true" />
                  ) : resolvedTheme === "dark" ? (
                    <Sun className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Moon className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
                <NotificationCenter />
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((currentValue) => !currentValue)}
                    className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 study-focus dark:bg-white/5"
                    aria-label="Open user menu"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.full_name}
                      email={profile?.email || user?.email}
                      size="sm"
                    />
                    <ChevronDown className={`hidden h-4 w-4 text-muted transition sm:block ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-border bg-card/95 p-2 shadow-card backdrop-blur-xl studyai-scale-in dark:bg-card/95" role="menu">
                      <div className="border-b border-border px-3 py-3">
                        <p className="truncate text-sm font-black text-text">{displayName}</p>
                        <p className="truncate text-xs font-semibold text-muted">{profile?.email || user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted transition hover:bg-surface hover:text-primary study-focus"
                        role="menuitem"
                      >
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted transition hover:bg-surface hover:text-primary study-focus"
                        role="menuitem"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-danger transition hover:bg-danger/10 study-focus"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="mb-7 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card studyai-slide-up dark:bg-card/85 dark:shadow-card-dark sm:p-6 lg:mb-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  {eyebrow && (
                    <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {eyebrow}
                    </p>
                  )}
                  <h1 id="page-title" className="mt-4 break-words text-3xl font-black tracking-normal text-text sm:text-4xl lg:text-5xl">
                    {title}
                  </h1>
                  {description && (
                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                      {description}
                    </p>
                  )}
                </div>
                <AIFeatureTabs />
              </div>
            </div>

            {children}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
