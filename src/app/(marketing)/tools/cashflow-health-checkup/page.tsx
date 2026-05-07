import type { Metadata } from "next";

import { PromoToolCapture } from "@/components/marketing/promo-tool-capture";
import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { CashflowHealthClient } from "@/components/tools/cashflow-health-client";
import { ToolSequenceGate } from "@/components/tools/tool-sequence-gate";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("cashflow-health-checkup");

export default function CashflowHealthPage() {
  return (
    <LeadIdentifyGate funnelContext="tool_entry" sourceToolSlug="cashflow-health-checkup">
      <PromoToolCapture slug="cashflow-health-checkup" />
      <ToolSequenceGate slug="cashflow-health-checkup">
        <CashflowHealthClient />
      </ToolSequenceGate>
    </LeadIdentifyGate>
  );
}
