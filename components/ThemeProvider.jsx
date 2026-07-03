"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { suppressThemeTransitions } from "@/lib/themeTransition";

function ThemeTransitionGuard() {
  useEffect(() => {
    let isDark = document.documentElement.classList.contains("dark");

    const observer = new MutationObserver(() => {
      const nextIsDark = document.documentElement.classList.contains("dark");

      if (nextIsDark !== isDark) {
        isDark = nextIsDark;
        suppressThemeTransitions();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="studyai-theme"
      disableTransitionOnChange
    >
      <ThemeTransitionGuard />
      {children}
    </NextThemesProvider>
  );
}
