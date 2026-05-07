import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HomeJourneyMap } from "@/components/marketing/home-journey-map";
import { HomeToolkitJourney } from "@/components/marketing/home-toolkit-journey";

import { getFeaturedLeadMagnetSlug, leadMagnetPromoPath } from "@/lib/config/marketing";
import { site } from "@/lib/config/site";
import { homeStructuredData } from "@/lib/seo/home-jsonld";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";

const homeDesc =
  "Free UAE Finance Navigator calculators and readiness check: finance maturity scoring, SME health pulse, AED cashflow runway, informational corporate tax dates, and hire vs outsourced finance economics.";

export const metadata: Metadata = {
  title: "Free UAE Finance Calculators & Readiness Check",
  description: homeDesc,
  keywords:
    "UAE finance tools, Dubai accounting calculator, corporate tax UAE, SME finance health, AED cashflow, finance outsourcing UAE, CFO clarity",
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: site.url,
    title: `${site.name} — ${site.company}`,
    description: homeDesc,
    siteName: site.name,
    images:
      site.ogImagePath.length > 0
        ? [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.name }]
        : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Free UAE Finance Tools`,
    description: homeDesc,
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const magnetSlug = getFeaturedLeadMagnetSlug();
  const magnet = magnetSlug ? TOOLS_BY_SLUG[magnetSlug] : null;

  return (
    <div className="space-y-14 md:space-y-16">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-navy-900/[0.07] bg-gradient-to-br from-white via-card to-orange-light/[0.35] px-4 py-12 shadow-[0_28px_70px_-40px_rgba(8,32,50,0.45)] ring-1 ring-black/[0.04] sm:px-6 sm:py-16 md:px-14 md:py-22">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-20%] top-[-60%] h-[120%] bg-[radial-gradient(ellipse_at_top,rgba(241,102,17,0.14),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-40%] right-[-15%] h-72 w-72 rounded-full bg-navy-900/[0.08] blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl space-y-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">{site.name}</p>
          <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground min-[400px]:text-[2rem] sm:text-4xl md:text-[2.85rem] md:leading-[1.1]">
            Free UAE finance tools — calculators &amp; readiness check
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl/[1.55]">
            Maturity scoring, AED cash runway, filings timing signals, and build-vs-buy finance economics — all built for founders and CFOs operating in the UAE.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button asChild size="lg" className="min-h-12 min-w-[200px] shadow-lg shadow-primary/25">
              <Link href="/assessment">Take the 2‑minute check</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 min-w-[200px] border-navy-900/14 bg-white/75 backdrop-blur-sm"
            >
              <Link href="/tools">Browse all calculators</Link>
            </Button>
          </div>
        </div>
      </section>

      <HomeJourneyMap />

      <HomeToolkitJourney />

      {magnet ? (
        <section
          className="rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-orange-light/30 px-4 py-8 shadow-[0_20px_50px_-32px_rgba(241,102,17,0.25)] ring-1 ring-primary/10 sm:px-6 sm:py-10 md:px-10 md:py-12"
          aria-labelledby="featured-tool-heading"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Featured this month</p>
              <h2 id="featured-tool-heading" className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {magnet.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{magnet.purpose}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg">
                <Link href={leadMagnetPromoPath(magnetSlug!)}>Try this calculator</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tools">Full toolkit order</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData()) }} />
    </div>
  );
}
