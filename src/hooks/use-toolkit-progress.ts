"use client";

import { useSyncExternalStore } from "react";

import { getCompletedTools, TOOLKIT_PROGRESS_KEY } from "@/lib/toolkit-progress";
import type { ToolSlug } from "@/lib/tools/registry";

/**
 * Stable snapshot for SSR and for “no completions” — useSyncExternalStore compares snapshots
 * with Object.is; a fresh [] on every getSnapshot triggers infinite update loops.
 */
const EMPTY_SNAPSHOT: ToolSlug[] = [];

let cachedSnapshot: ToolSlug[] = EMPTY_SNAPSHOT;
let cachedKey = "";

function getClientSnapshot(): ToolSlug[] {
  const fresh = getCompletedTools();
  const key = fresh.length === 0 ? "" : fresh.join("\0");
  if (key === cachedKey) return cachedSnapshot;
  cachedKey = key;
  cachedSnapshot = fresh.length === 0 ? EMPTY_SNAPSHOT : [...fresh];
  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOOLKIT_PROGRESS_KEY || e.key === null) listener();
  };
  const onCustom = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("finance-navigator:toolkit-progress", onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("finance-navigator:toolkit-progress", onCustom as EventListener);
  };
}

export function useToolkitProgress() {
  return useSyncExternalStore(subscribe, getClientSnapshot, (): ToolSlug[] => EMPTY_SNAPSHOT);
}
