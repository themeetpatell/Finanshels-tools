import type { Metadata } from "next";

import { ToolsSequentialJourney } from "@/components/tools/tools-sequential-journey";
import { site } from "@/lib/config/site";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";

const desc =
  "Walk the five Finance Navigator tools in order — maturity, health, cashflow, corporate tax timing, and hiring vs outsourcing. Sequential funnel, not a flat menu.";

export const metadata: Metadata = {
  title: "Toolkit sequence",
  description: desc,
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: `${site.url}/tools`,
    title: "Toolkit sequence · Finance Navigator",
    description: desc,
    siteName: `${site.name} · Finanshels`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolkit sequence · Finance Navigator",
    description: desc,
  },
  alternates: { canonical: "/tools" },
};

export default function ToolsListingPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Sequential toolkit</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground">Finance Navigator — in order</h1>
        <p className="max-w-3xl text-pretty text-muted-foreground leading-relaxed">
          You move through <strong className="text-foreground">{CANONICAL_TOOL_SEQUENCE.length} steps</strong>, one focus at a time.
          Open each tool when you are ready, finish it, then come back here for the next step — or start with the{" "}
          <strong className="text-foreground">Assessment</strong> for a personalized sequence.
        </p>
      </header>

      <ToolsSequentialJourney />
    </div>
  );
}
