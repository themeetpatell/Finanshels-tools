import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { site } from "@/lib/config/site";
import { TRACK_LABELS, TRACK_ORDER } from "@/lib/tools/tracks";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { faqStructuredData, homeStructuredData } from "@/lib/seo/home-jsonld";

export const metadata: Metadata = {
  title: "Finance clarity for UAE operators",
  description:
    "Finance Navigator — sequential assessment and toolkit for UAE operators. Navy and orange brand system, Inter typography, one step at a time.",
};

const faqs = [
  {
    question: "Is Finance Navigator tax or legal advice?",
    answer:
      "No — outputs are directional and educational. Material regulatory or tax conclusions require qualified UAE advisers reviewing your facts.",
  },
  {
    question: "Why sequential instead of picking calculators from a grid?",
    answer:
      "Operators rarely have isolated problems. A fixed order (or an assessment-routed order) reduces thrash: each step feeds context into the next.",
  },
  {
    question: "Can I skip a step?",
    answer:
      "You can, but we still present the toolkit as a sequence so teams don’t bounce randomly. Complete what matters, then move on when ready.",
  },
  {
    question: "Which currencies does the tooling assume?",
    answer:
      "Monetary benchmarks use AED-first framing for UAE SMEs. Swap benchmark tables centrally when regional pricing updates land.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 md:px-14 md:py-16 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-[-40%] h-80 bg-[radial-gradient(ellipse_at_top,rgba(241,102,17,0.12),transparent_55%)]"
        />
        <div className="relative space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Finance Navigator · {site.company}</p>
          <h1 className="max-w-3xl text-pretty text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            UAE finance clarity — one step at a time, not a wall of choices.
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Start with the <strong className="font-medium text-foreground">Assessment</strong>, then walk the{" "}
            <strong className="font-medium text-foreground">toolkit sequence</strong> in order. Built for trust-heavy financial decisions on a warm
            cream canvas with clear navy type and orange CTAs.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/assessment">Step 1 · Start assessment</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tools">Continue · Toolkit sequence</Link>
            </Button>
          </div>
          <Separator className="my-10" />
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">How the funnel works</h2>
              <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <li>
                  <span className="font-semibold text-primary">1.</span> Answer a short routing assessment (business model, compliance posture, urgency).
                </li>
                <li>
                  <span className="font-semibold text-primary">2.</span> Open the first recommended tool — complete it before moving on.
                </li>
                <li>
                  <span className="font-semibold text-primary">3.</span> Follow the toolkit sequence (or your personalized top three from the assessment).
                </li>
                <li>
                  <span className="font-semibold text-primary">4.</span> Export, share, or escalate to Finanshels on WhatsApp / book a review.
                </li>
              </ol>
            </div>
            <Card className="border-primary/25 bg-orange-light/60">
              <CardHeader>
                <CardTitle className="text-lg">Operational promise</CardTitle>
                <CardDescription>Sequential by design — CFOs can screenshot results and hand them to auditors or banks without reformatting.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AED-native benchmarks and UAE rule constants live in config modules so advisers can update inputs without redeploying UX shells.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">The standard sequence (5 steps)</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This is the default order on the Toolkit page. Your assessment may reorder emphasis, but you still move through tools deliberately — not all at once.
          </p>
        </div>
        <ol className="space-y-0">
          {CANONICAL_TOOL_SEQUENCE.map((slug, index) => {
            const tool = TOOLS_BY_SLUG[slug];
            return (
              <li
                key={slug}
                className="flex gap-4 border-b border-border py-5 first:pt-0 last:border-b-0"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                  aria-hidden
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{TRACK_LABELS[tool.trackId].title}</p>
                  <h3 className="text-lg font-semibold text-foreground">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.purpose}</p>
                  <p className="text-xs text-muted-foreground">~{tool.etaMinutes} min</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/tools">Open toolkit sequence</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/assessment">Get a personalized order</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Four phases (what the sequence covers)</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Tracks describe the type of work — not separate menus. You still experience them in flow through the toolkit, not as four equal “choose your adventure” cards.
          </p>
        </div>
        <ol className="relative ms-3 space-y-8 border-s-2 border-primary/25 ps-10">
          {TRACK_ORDER.map((track, i) => (
            <li key={track} className="relative">
              <span
                className="absolute -start-[29px] flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-foreground">{TRACK_LABELS[track].title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{TRACK_LABELS[track].subtitle}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Trusted Finanshels execution spine</CardTitle>
            <CardDescription>Navigator is calibrated for Gulf-grade operators and governance-minded founders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Compliance estimators isolate legal drift from UX — escalate when timelines become existential.</p>
            <p>Lead capture payloads mirror CRM schemas so outbound teams don’t reshape context by hand.</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/how-it-works">How results work</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="border-dashed border-primary/20 bg-peach-muted/25 shadow-sm">
          <CardHeader>
            <CardTitle>After each step</CardTitle>
            <CardDescription>You always get interpretation, next-step tooling, and escalation — not a dead end.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 ps-5">
              <li>Scores and plain-language risks.</li>
              <li>What to run next (sequenced).</li>
              <li>Optional lead capture & expert handoff.</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/assessment">Start the path</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
          <p className="text-sm text-muted-foreground">High-signal answers for finance leaders evaluating digital entry points.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl border border-border bg-card px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{faq.question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData()) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(faqs)) }} />
    </div>
  );
}
