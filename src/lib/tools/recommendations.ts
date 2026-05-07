import type { ToolDefinition, ToolSlug } from "@/lib/tools/registry";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";

/** Next tools always follow toolkit order (`CANONICAL_TOOL_SEQUENCE`) — no links that skip earlier steps. */
export function getNextRecommendedTools(slug: ToolSlug, count = 3): ToolDefinition[] {
  const i = CANONICAL_TOOL_SEQUENCE.indexOf(slug);
  if (i === -1) return [];
  return CANONICAL_TOOL_SEQUENCE.slice(i + 1, i + 1 + count).map((s) => TOOLS_BY_SLUG[s]);
}
