"use client";

import { LogOut, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { getCurrentUser, getSupabase } from "@/lib/supabase";
import { suppressThemeTransitions } from "@/lib/themeTransition";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "AI Notes", href: "#ai-notes" },
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean);

    function setFromHash() {
      if (window.location.hash) {
        setActiveHref(window.location.hash);
      }
    }

    setFromHash();
    window.addEventListener("hashchange", setFromHash);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveHref(`#${visible.target.id}`);
        }
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0.12, 0.24, 0.36],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", setFromHash);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    try {
      const supabase = getSupabase();

      getCurrentUser().then(({ user: currentUser }) => {
        setUser(currentUser);
      });

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
        }
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    } catch (_error) {
      setUser(null);
    }
  }, []);

  function toggleTheme() {
    if (!isThemeMounted) return;

    suppressThemeTransitions();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  function handleNavClick(href) {
    setActiveHref(href);
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-border/80 bg-white/80 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_12px_40px_rgba(2,6,23,0.35)]">
      <nav className="relative mx-auto flex h-[72px] w-full max-w-[390px] items-center justify-between gap-2 px-3 sm:max-w-7xl sm:gap-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <a
          href="#home"
          onClick={() => handleNavClick("#home")}
          className="group flex min-w-0 items-center gap-2 rounded-2xl study-focus sm:gap-3"
          aria-label="StudyAI home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:bg-primary-hover">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-base font-black tracking-normal text-text sm:text-lg">
            StudyAI
          </span>
        </a>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full border border-border/80 bg-surface/70 p-1 text-sm font-semibold text-muted shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex" aria-label="Landing page sections">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                aria-current={isActive ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 transition duration-200 hover:-translate-y-0.5 hover:text-primary-hover ${
                  isActive ? "bg-card text-primary shadow-sm dark:bg-white/10 dark:text-indigo-200" : "text-muted dark:text-slate-300"
                }`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </a>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/90 text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Toggle dark mode"
          >
            {!isThemeMounted ? (
              <span className="h-5 w-5" aria-hidden="true" />
            ) : resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover sm:inline-flex"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/90 text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:inline-flex"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden min-h-10 items-center rounded-xl px-4 text-sm font-bold text-muted transition hover:-translate-y-0.5 hover:text-primary-hover sm:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="hidden min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover sm:inline-flex"
              >
                Get Started Free
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/90 text-muted shadow-sm transition hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div id="landing-mobile-menu" className="absolute inset-x-0 top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto border-b border-border bg-card/95 px-4 py-4 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 sm:px-6 lg:hidden" role="dialog" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navLinks.map((link) => {
              const isActive = activeHref === link.href;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-between rounded-xl px-4 text-sm font-semibold transition hover:bg-surface hover:text-primary-hover ${
                    isActive ? "bg-surface text-primary" : "text-muted"
                  }`}
                >
                  {link.label}
                  {isActive ? <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> : null}
                </a>
              );
            })}

            <div className="mt-2 grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-primary-hover transition hover:bg-surface"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-primary-hover transition hover:bg-surface"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
