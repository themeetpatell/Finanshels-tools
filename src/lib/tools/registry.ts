import type { TrackId } from "@/lib/tools/tracks";

export type ToolSlug =
  | "finance-maturity-score"
  | "financial-health-checkup"
  | "cashflow-health-checkup"
  | "corporate-tax-deadline-checker"
  | "hiring-vs-outsourcing-benchmark";

export type ToolDefinition = {
  slug: ToolSlug;
  title: string;
  purpose: string;
  etaMinutes: number;
  trackId: TrackId;
  /** For SEO + sharing */
  ogDescription: string;
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "finance-maturity-score",
    title: "Finance Maturity Score",
    purpose: "Bench your finance operating model across compliance, cash, ops, reporting, and team.",
    etaMinutes: 6,
    trackId: "scale_smarter",
    ogDescription:
      "Weighted UAE finance maturity scoring with risks, priorities, and next tools — Finance Navigator by Finanshels.",
  },
  {
    slug: "financial-health-checkup",
    title: "Financial Health Checkup",
    purpose: "Translate revenue, margins, reserves, and process discipline into a practical health snapshot.",
    etaMinutes: 5,
    trackId: "stay_in_control",
    ogDescription:
      "Finance health scoring for UAE operators: margins, reserves, discipline, tax readiness.",
  },
  {
    slug: "cashflow-health-checkup",
    title: "Cashflow Health Checkup",
    purpose: "Stress-test runway, collections, concentration, and fixed obligations.",
    etaMinutes: 5,
    trackId: "stay_in_control",
    ogDescription:
      "Cashflow pressure test with runway signals and practical actions for UAE SMEs.",
  },
  {
    slug: "corporate-tax-deadline-checker",
    title: "Corporate Tax Deadline Checker",
    purpose: "Estimate filing/payment due dates from FY end using configurable UAE baseline rules.",
    etaMinutes: 3,
    trackId: "stay_compliant",
    ogDescription:
      "Informational UAE corporate tax deadline estimator with urgency states — confirm with advisors.",
  },
  {
    slug: "hiring-vs-outsourcing-benchmark",
    title: "Hiring vs Outsourcing Benchmark",
    purpose: "Compare in-house finance build vs outsourced packages with overhead truth-testing.",
    etaMinutes: 7,
    trackId: "start_right",
    ogDescription:
      "Side-by-side cost model: finance hires vs outsourced finance packages for UAE businesses.",
  },
];

export const TOOLS_BY_SLUG = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
) as Record<ToolSlug, ToolDefinition>;

export function toolsByTrack(track: TrackId) {
  return TOOLS.filter((t) => t.trackId === track).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}
