let transitionTimeoutId;

export function suppressThemeTransitions() {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  root.dataset.themeChanging = "true";

  window.clearTimeout(transitionTimeoutId);
  transitionTimeoutId = window.setTimeout(() => {
    delete root.dataset.themeChanging;
  }, 250);
}
