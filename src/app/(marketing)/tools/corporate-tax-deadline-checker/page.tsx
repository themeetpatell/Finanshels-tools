import type { Metadata } from "next";

import { PromoToolCapture } from "@/components/marketing/promo-tool-capture";
import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { CorporateTaxDeadlineClient } from "@/components/tools/corporate-tax-deadline-client";
import { ToolSequenceGate } from "@/components/tools/tool-sequence-gate";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("corporate-tax-deadline-checker");

export default function CorporateTaxPage() {
  return (
    <LeadIdentifyGate funnelContext="tool_entry" sourceToolSlug="corporate-tax-deadline-checker">
      <PromoToolCapture slug="corporate-tax-deadline-checker" />
      <ToolSequenceGate slug="corporate-tax-deadline-checker">
        <CorporateTaxDeadlineClient />
      </ToolSequenceGate>
    </LeadIdentifyGate>
  );
}
