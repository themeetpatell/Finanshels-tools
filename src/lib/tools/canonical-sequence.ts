import type { ToolDefinition, ToolSlug } from "@/lib/tools/registry";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";

export type FunnelPhaseNumber = 1 | 2;

export type FunnelPhaseMeta = {
  phase: FunnelPhaseNumber;
  /** Visitor-facing — toolkit page, headers, cards */
  visitorTitle: string;
  visitorSummary: string;
  visitorDescription: string;
  /**
   * Internal only: analytics (`dataLayer`), `tool_sessions.metadata`, integrators.
   * Never render this on public marketing UI.
   */
  funnelLabel: string;
  /** Internal reference for CRM operators / README */
  crmStages: readonly string[];
  tools: readonly ToolSlug[];
};

/**
 * Toolkit is two **visitor** parts (snapshot → decisions). Unlock order is the concatenated `tools` lists.
 * `funnelLabel` / `crmStages` stay off the site — they exist for pipes and reporting only.
 */
export const FUNNEL_PHASES: readonly FunnelPhaseMeta[] = [
  {
    phase: 1,
    visitorTitle: "Understand your position",
    visitorSummary: "See how your finance function, business health, and cash shape up — in plain language.",
    visitorDescription:
      "These three steps build a clear snapshot of where you are today. That context makes the next tools (timelines and hiring costs) meaningful instead of generic.",
    funnelLabel: "Lead created → Lead qualified",
    crmStages: ["Lead / New", "Working", "Marketing qualified"],
    tools: ["finance-maturity-score", "financial-health-checkup", "cashflow-health-checkup"],
  },
  {
    phase: 2,
    visitorTitle: "Plan your next moves",
    visitorSummary: "Map corporate tax timelines and compare hiring in-house with outsourcing — using your own numbers.",
    visitorDescription:
      "Once you know your baseline, use these to stress-test deadlines and budgets. Handy for founders, finance leads, and whoever helps you decide how to staff finance.",
    funnelLabel: "Lead qualified → Client closed",
    crmStages: ["Sales qualified", "Opportunity", "Proposal / negotiation", "Closed won"],
    tools: ["corporate-tax-deadline-checker", "hiring-vs-outsourcing-benchmark"],
  },
];

const slugToPhase: Record<ToolSlug, FunnelPhaseNumber> = FUNNEL_PHASES.reduce(
  (acc, meta) => {
    for (const slug of meta.tools) acc[slug] = meta.phase;
    return acc;
  },
  {} as Record<ToolSlug, FunnelPhaseNumber>,
);

export function funnelPhaseForSlug(slug: ToolSlug): FunnelPhaseNumber {
  return slugToPhase[slug];
}

export function funnelPhaseMetaForSlug(slug: ToolSlug): FunnelPhaseMeta {
  const p = funnelPhaseForSlug(slug);
  return FUNNEL_PHASES.find((x) => x.phase === p)!;
}

/** Linear unlock + recommendation order — earlier parts precede timeline / economics tools */
export const CANONICAL_TOOL_SEQUENCE: ToolSlug[] = FUNNEL_PHASES.flatMap((p) => [...p.tools]);

export function funnelStepNumber(slug: ToolSlug): number {
  const i = CANONICAL_TOOL_SEQUENCE.indexOf(slug);
  return i < 0 ? 0 : i + 1;
}

/** Supabase `/api/tool-session` optional metadata — internal labels only */
export function toolFunnelContext(slug: ToolSlug): { funnelPhase: FunnelPhaseNumber; funnelStageLabel: string } {
  const meta = funnelPhaseMetaForSlug(slug);
  return { funnelPhase: meta.phase, funnelStageLabel: meta.funnelLabel };
}

export function canonicalSequenceDefinitions(): ToolDefinition[] {
  return CANONICAL_TOOL_SEQUENCE.map((slug) => TOOLS_BY_SLUG[slug]);
}
