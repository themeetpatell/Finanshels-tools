import type { Metadata } from "next";

import { PromoToolCapture } from "@/components/marketing/promo-tool-capture";
import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { FinancialHealthClient } from "@/components/tools/financial-health-client";
import { ToolSequenceGate } from "@/components/tools/tool-sequence-gate";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("financial-health-checkup");

export default function FinancialHealthPage() {
  return (
    <LeadIdentifyGate funnelContext="tool_entry" sourceToolSlug="financial-health-checkup">
      <PromoToolCapture slug="financial-health-checkup" />
      <ToolSequenceGate slug="financial-health-checkup">
        <FinancialHealthClient />
      </ToolSequenceGate>
    </LeadIdentifyGate>
  );
}
