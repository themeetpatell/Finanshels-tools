"use client";

const KEY = "finance-navigator_lead_identity_v2";

/** Stored client-side once identification POST succeeds — matches hiring benchmark gate subset. */
export type StoredLeadIdentity = {
  fullName: string;
  workEmail: string;
  companyName: string;
  companySize: "1-5" | "6-20" | "21-50" | "51-200" | "201-plus";
  savedAt: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function readLeadIdentity(): StoredLeadIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!isRecord(p)) return null;
    const keys = ["fullName", "workEmail", "companyName", "companySize", "savedAt"] as const;
    for (const k of keys) {
      if (typeof p[k] !== "string" || !p[k]) return null;
    }
    const cs = p.companySize;
    if (!["1-5", "6-20", "21-50", "51-200", "201-plus"].includes(cs as string)) return null;
    return {
      fullName: String(p.fullName),
      workEmail: String(p.workEmail),
      companyName: String(p.companyName),
      companySize: cs as StoredLeadIdentity["companySize"],
      savedAt: String(p.savedAt),
    };
  } catch {
    return null;
  }
}

export function writeLeadIdentity(profile: Omit<StoredLeadIdentity, "savedAt">): StoredLeadIdentity {
  const enriched: StoredLeadIdentity = {
    ...profile,
    savedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(enriched));
    window.dispatchEvent(new CustomEvent("finance-navigator:lead-identity"));
  }
  return enriched;
}

export function clearLeadIdentity() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("finance-navigator:lead-identity"));
  }
}

export function hasLeadIdentity(): boolean {
  return readLeadIdentity() !== null;
}

export function leadIdentityEventName() {
  return "finance-navigator:lead-identity";
}

/** Prefer first meaningful token for tooling that asks for first name only. */
export function firstNameFromFullName(fullName: string): string {
  const t = fullName.trim().split(/\s+/).filter(Boolean);
  return t[0] ?? fullName.trim();
}
