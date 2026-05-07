import type { Metadata } from "next";

import { PromoToolCapture } from "@/components/marketing/promo-tool-capture";
import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { HiringBenchmarkClient } from "@/components/tools/hiring-benchmark-client";
import { ToolSequenceGate } from "@/components/tools/tool-sequence-gate";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("hiring-vs-outsourcing-benchmark");

export default function HiringBenchmarkPage() {
  return (
    <LeadIdentifyGate funnelContext="tool_entry" sourceToolSlug="hiring-vs-outsourcing-benchmark">
      <PromoToolCapture slug="hiring-vs-outsourcing-benchmark" />
      <ToolSequenceGate slug="hiring-vs-outsourcing-benchmark">
        <HiringBenchmarkClient />
      </ToolSequenceGate>
    </LeadIdentifyGate>
  );
}
