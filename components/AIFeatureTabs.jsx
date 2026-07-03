"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const aiTabs = [
  {
    label: "Notes",
    href: "/ai-notes",
    paths: ["/ai-notes"],
  },
  {
    label: "Summaries",
    href: "/ai-summary",
    paths: ["/ai-summary"],
  },
  {
    label: "Questions",
    href: "/ai-quiz",
    paths: ["/questions", "/ai-quiz"],
  },
];

export default function AIFeatureTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2 text-center text-xs font-bold text-muted sm:w-80"
      aria-label="AI feature navigation"
    >
      {aiTabs.map((tab) => {
        const isActive = tab.paths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`)
        );

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-xl px-3 py-3 transition hover:bg-card hover:text-primary study-focus ${
              isActive ? "bg-card text-primary shadow-sm" : ""
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
