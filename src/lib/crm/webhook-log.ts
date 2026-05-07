import type { Json } from "@/lib/types/json";

/** Normalized payload destined for Zapier/Make/CRM — logged when CRM URL not configured yet */
export function buildCrmPayload(input: {
  lead: Record<string, unknown>;
  assessment?: Record<string, unknown>;
  calculator?: { toolSlug: string; inputs: Json; outputs: Json };
  toolSessionMeta?: Record<string, unknown>;
}) {
  return {
    event: "finance_navigator_lead",
    version: "2026-05-07",
    createdAt: new Date().toISOString(),
    ...input,
  };
}
