import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";
import type { ToolSlug } from "@/lib/tools/registry";

export const TOOLKIT_PROGRESS_KEY = "finance-navigator_toolkit_completed_v1";

/** Session-only bypass so marketing can deep-link one calculator (`?promo=1`). */
export const PROMO_UNLOCK_KEY = "finance-navigator_promo_unlock_v1";

const PROMO_BUMP_EVENT = "finance-navigator:promo-updated";

/** Stable reference when there are no completions — safe for external-store snapshots. */
const EMPTY_READ: ToolSlug[] = [];

function readStored(): ToolSlug[] {
  if (typeof window === "undefined") return EMPTY_READ;
  try {
    const raw = window.localStorage.getItem(TOOLKIT_PROGRESS_KEY);
    if (!raw) return EMPTY_READ;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_READ;
    const filtered = parsed.filter((s): s is ToolSlug =>
      CANONICAL_TOOL_SEQUENCE.includes(s as ToolSlug),
    );
    return filtered.length === 0 ? EMPTY_READ : filtered;
  } catch {
    return EMPTY_READ;
  }
}

function writeStored(slugs: ToolSlug[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(slugs)];
  window.localStorage.setItem(TOOLKIT_PROGRESS_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent("finance-navigator:toolkit-progress"));
}

/** Index of slug in canonical sequence — -1 if unknown */
export function toolSequenceIndex(slug: ToolSlug): number {
  return CANONICAL_TOOL_SEQUENCE.indexOf(slug);
}

function readPromoSlug(): ToolSlug | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROMO_UNLOCK_KEY);
    if (!raw || !CANONICAL_TOOL_SEQUENCE.includes(raw as ToolSlug)) return null;
    return raw as ToolSlug;
  } catch {
    return null;
  }
}

/** Single-tool campaign unlock — does not mutate completion progress. */
export function setPromotedToolSlug(slug: ToolSlug) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROMO_UNLOCK_KEY, slug);
  window.dispatchEvent(new CustomEvent(PROMO_BUMP_EVENT));
}

export function clearPromotedToolSlug() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROMO_UNLOCK_KEY);
  window.dispatchEvent(new CustomEvent(PROMO_BUMP_EVENT));
}

export function getPromotedToolSlug(): ToolSlug | null {
  return readPromoSlug();
}

export function promoUnlockEventName(): string {
  return PROMO_BUMP_EVENT;
}

export function isToolUnlocked(slug: ToolSlug): boolean {
  if (readPromoSlug() === slug) return true;
  const i = toolSequenceIndex(slug);
  if (i <= 0) return true;
  const done = new Set(readStored());
  for (let k = 0; k < i; k++) {
    const prev = CANONICAL_TOOL_SEQUENCE[k];
    if (prev && !done.has(prev)) return false;
  }
  return true;
}

/** First slug the user cannot open yet (next to complete), or null if all prior done */
export function firstBlockingSlug(slug: ToolSlug): ToolSlug | null {
  const i = toolSequenceIndex(slug);
  if (i <= 0) return null;
  const done = new Set(readStored());
  for (let k = 0; k < i; k++) {
    const prev = CANONICAL_TOOL_SEQUENCE[k];
    if (prev && !done.has(prev)) return prev;
  }
  return null;
}

export function markToolCompleted(slug: ToolSlug) {
  const done = readStored();
  if (done.includes(slug)) {
    writeStored(done);
    return;
  }
  writeStored([...done, slug]);
}

export function getCompletedTools(): ToolSlug[] {
  return readStored();
}

export function clearToolkitProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOOLKIT_PROGRESS_KEY);
  window.dispatchEvent(new CustomEvent("finance-navigator:toolkit-progress"));
}
