import type { Metadata } from "next";

import { PromoToolCapture } from "@/components/marketing/promo-tool-capture";
import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { FinanceMaturityClient } from "@/components/tools/finance-maturity-client";
import { ToolSequenceGate } from "@/components/tools/tool-sequence-gate";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("finance-maturity-score");

export default function FinanceMaturityPage() {
  return (
    <LeadIdentifyGate funnelContext="tool_entry" sourceToolSlug="finance-maturity-score">
      <PromoToolCapture slug="finance-maturity-score" />
      <ToolSequenceGate slug="finance-maturity-score">
        <FinanceMaturityClient />
      </ToolSequenceGate>
    </LeadIdentifyGate>
  );
}
