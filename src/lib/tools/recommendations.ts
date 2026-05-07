import type { ToolDefinition, ToolSlug } from "@/lib/tools/registry";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";

const DEFAULT_CHAIN: ToolSlug[] = [...CANONICAL_TOOL_SEQUENCE];

const NEXT_MAP: Partial<Record<ToolSlug, ToolSlug[]>> = {
  "finance-maturity-score": [
    "financial-health-checkup",
    "cashflow-health-checkup",
    "corporate-tax-deadline-checker",
  ],
  "financial-health-checkup": ["cashflow-health-checkup", "finance-maturity-score", "corporate-tax-deadline-checker"],
  "cashflow-health-checkup": ["financial-health-checkup", "hiring-vs-outsourcing-benchmark", "finance-maturity-score"],
  "corporate-tax-deadline-checker": ["financial-health-checkup", "finance-maturity-score", "cashflow-health-checkup"],
  "hiring-vs-outsourcing-benchmark": ["finance-maturity-score", "financial-health-checkup", "cashflow-health-checkup"],
};

export function getNextRecommendedTools(slug: ToolSlug, count = 3): ToolDefinition[] {
  const picks = NEXT_MAP[slug] ?? DEFAULT_CHAIN.filter((s) => s !== slug);
  return picks.slice(0, count).map((s) => TOOLS_BY_SLUG[s]);
}
