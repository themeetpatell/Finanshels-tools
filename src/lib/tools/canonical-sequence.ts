import type { ToolDefinition, ToolSlug } from "@/lib/tools/registry";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";

/** Default order for the Finance Navigator toolkit — one step at a time, not a flat menu. */
export const CANONICAL_TOOL_SEQUENCE: ToolSlug[] = [
  "finance-maturity-score",
  "financial-health-checkup",
  "cashflow-health-checkup",
  "corporate-tax-deadline-checker",
  "hiring-vs-outsourcing-benchmark",
];

export function canonicalSequenceDefinitions(): ToolDefinition[] {
  return CANONICAL_TOOL_SEQUENCE.map((slug) => TOOLS_BY_SLUG[slug]);
}
