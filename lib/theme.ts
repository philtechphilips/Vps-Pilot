import { useSyncExternalStore } from "react";
import { KEY, QUERY } from "@/lib/theme-script";

/**
 * Light / dark theme. The choice ("system" follows the OS) is a per-browser
 * preference in localStorage; the resolved theme lives on <html data-theme>,
 * which every colour token in globals.css reads.
 */
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function apply() {
  const preference = readPreference();
  const dark = preference === "dark" || (preference === "system" && window.matchMedia(QUERY).matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === KEY) apply();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.matchMedia(QUERY).addEventListener("change", apply);
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.matchMedia(QUERY).removeEventListener("change", apply);
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // Storage blocked: the choice still applies to this page.
  }
  apply();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, readPreference, () => "system");
}

/** The theme on screen right now ("system" already resolved). */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "light");
}
