import { toolFunnelContext } from "@/lib/tools/canonical-sequence";
import type { ToolSlug } from "@/lib/tools/registry";

export function toolSessionRequestBody(
  toolSlug: ToolSlug,
  anonymousToken: string | null | undefined,
  inputs: unknown,
  outputs: unknown,
) {
  const { funnelPhase, funnelStageLabel } = toolFunnelContext(toolSlug);
  return {
    toolSlug,
    anonymousToken: anonymousToken ?? undefined,
    inputs,
    outputs,
    funnelPhase,
    funnelStageLabel,
  };
}
