"use client";

import {
  BookOpenCheck,
  BrainCircuit,
  FileText,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserRole, getSupabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-notes", label: "AI Notes", icon: FileText },
  { href: "/ai-summary", label: "AI Summary", icon: Layers },
  { href: "/ai-quiz", label: "AI Quiz", icon: BookOpenCheck },
  { href: "/flashcards", label: "Flashcards", icon: BrainCircuit },
  { href: "/history", label: "History", icon: History },
  { href: "/notes", label: "Saved Notes", icon: StickyNote },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

const tourTargetsByHref = {
  "/profile": "profile",
};

function isLinkActive(pathname, href) {
  const cleanHref = href.split("#")[0];

  if (cleanHref === "/") {
    return pathname === "/";
  }

  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadAdminAccess() {
      try {
        const { role, error } = await getCurrentUserRole();

        if (error || role !== "admin") {
          if (!ignore) setIsAdmin(false);
          return;
        }

        if (!ignore) {
          setIsAdmin(true);
        }
      } catch (_error) {
        if (!ignore) setIsAdmin(false);
      }
    }

    loadAdminAccess();

    const supabase = getSupabase();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAdminAccess();
    });

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const visibleLinks = useMemo(
    () => links.filter((link) => link.href !== "/admin" || isAdmin),
    [isAdmin]
  );

  async function handleLogout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="border-b border-border bg-sidebar/95 backdrop-blur-xl dark:bg-sidebar/90 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r" aria-label="Dashboard navigation">
      <div className="flex h-full flex-col gap-5 px-4 py-4 sm:px-5 lg:gap-6 lg:py-5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl study-focus">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-black tracking-normal text-text">StudyAI</span>
              <span className="block truncate text-xs font-semibold text-muted">AI study workspace</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:text-primary study-focus"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:overflow-y-auto lg:pr-1 study-scrollbar" aria-label="Workspace sections">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.active === false ? false : isLinkActive(pathname, link.href);

            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                data-onboarding-target={tourTargetsByHref[link.href] || undefined}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-bold transition duration-200 study-focus sm:text-sm lg:justify-start lg:gap-3 lg:px-4 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:-translate-y-0.5 hover:bg-surface hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="break-words leading-tight">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
