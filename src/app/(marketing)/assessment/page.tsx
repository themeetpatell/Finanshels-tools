import type { Metadata } from "next";

import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { AssessmentClient } from "@/components/tools/assessment-client";
import { site } from "@/lib/config/site";

const desc =
  "Free UAE finance readiness check (~2 minutes). Answer a few multiple-choice prompts on mainland vs free zone, filings posture, invoicing volume, and priorities — Finance Navigator recommends which AED calculators to run first.";

export const metadata: Metadata = {
  title: "UAE Finance Readiness Check — Free Calculator Routing",
  description: desc,
  keywords:
    "UAE finance assessment Dubai, free zone vs mainland SME, corporate tax readiness UAE, finance calculator starter, AED business health",
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: `${site.url}/assessment`,
    title: `${site.name} Readiness Check · Free`,
    description: desc,
    siteName: `${site.name} · Finanshels`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} readiness check`,
    description: desc,
  },
  alternates: { canonical: "/assessment" },
  robots: { index: true, follow: true },
};

export default function AssessmentPage() {
  return (
    <LeadIdentifyGate funnelContext="assessment_entry">
      <AssessmentClient />
    </LeadIdentifyGate>
  );
}
