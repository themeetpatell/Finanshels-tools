import type { Metadata } from "next";

import { LeadIdentifyGate } from "@/components/lead/lead-identify-gate";
import { ToolsSequentialJourney } from "@/components/tools/tools-sequential-journey";
import { site } from "@/lib/config/site";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";

const desc =
  "Finance Navigator toolkit: five UAE finance calculators in logical order — finance maturity scoring, SME health pulse, AED cash stress test, informational corporate tax due-date estimator, and hire vs outsourced finance benchmark. Start free.";

export const metadata: Metadata = {
  title: "UAE Finance Calculator Toolkit — 5 Tools",
  description: desc,
  keywords:
    "UAE finance toolkit, AED calculators, SME finance maturity, UAE corporate tax estimator, outsourced finance UAE, cashflow runway Dubai",
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: `${site.url}/tools`,
    title: `Toolkit · ${site.name}`,
    description: desc,
    siteName: `${site.name} · Finanshels`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Toolkit · ${site.name}`,
    description: desc,
  },
  alternates: { canonical: "/tools" },
  robots: { index: true, follow: true },
};

export default function ToolsListingPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Sequential toolkit</p>
        <h1 className="text-balance text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground min-[400px]:text-3xl sm:text-4xl">
          Five tools, one sensible path
        </h1>
        <p className="max-w-3xl text-pretty text-muted-foreground leading-relaxed">
          Walk through <strong className="text-foreground">{CANONICAL_TOOL_SEQUENCE.length} steps</strong> at your pace. The first tools help you see the full
          picture; the last two help you think through timing and how to staff finance. Open each step in order — or start with the{" "}
          <strong className="text-foreground">Assessment</strong> if you want a tailored starting point.
        </p>
      </header>

      <LeadIdentifyGate funnelContext="toolkit_hub">
        <ToolsSequentialJourney />
      </LeadIdentifyGate>
    </div>
  );
}
