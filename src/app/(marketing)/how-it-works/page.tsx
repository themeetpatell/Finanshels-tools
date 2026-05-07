import type { Metadata } from "next";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { faqStructuredData } from "@/lib/seo/home-jsonld";

export const metadata: Metadata = {
  title: "How Navigator results work",
  description:
    "Methodology primer for UAE Finance Navigator — scoring intent, disclaimers, data handling through Supabase, and how to escalate to advisory.",
};

const qa = [
  {
    question: "How deterministic are the scores?",
    answer:
      "Every engine expresses transparent weighting assumptions in code modules under `src/lib/scoring`. Treat scores as calibrated heuristics, not audited certifications.",
  },
  {
    question: "Where do configurable compliance constants live?",
    answer:
      "UAE estimator offsets and maturity thresholds reside in `src/lib/config/uaeRules.ts` so advisers can revise guidance without refactoring UI primitives.",
  },
  {
    question: "What gets persisted after lead capture?",
    answer:
      "Structured columns for operational CRM usage plus nested `crm_payload` JSON mirroring Zapier/Make friendly envelopes. Anonymous calculator completions optionally log calculator JSON when Supabase is provisioned.",
  },
];

export default function HowItWorksPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-primary">Operational transparency</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">How Navigator results behave</h1>
        <p className="max-w-3xl text-muted-foreground leading-relaxed">
          Finance Navigator is engineered for escalation — deterministic scoring, repeatable exports, webhook shaped payloads — while staying explicit where human judgement must intervene.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Scoring model philosophy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Weighted composites compress messy operating truth into prioritized actions. Engines favour signals that materially change banker conversations, creditor negotiations, filings readiness, or capital planning within UAE SMEs.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data handling & integrations</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Server routes validate submissions with Zod, persist optionally through Supabase service credentials, and log CRM-ready payloads to stdout even in mock modes so integration engineers capture envelope contracts early.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Responsible usage</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Outputs may be circulated internally — but regulatory interpretations, corporate structuring, taxable presence, TP policy, visa policy, Emiratisation, and audited financial assertions always require contextual human review for your entity facts.
        </p>
        <Button asChild>
          <Link href="/assessment">Run your routing pass</Link>
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {qa.map((item) => (
          <details key={item.question} className="rounded-xl border px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">{item.question}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </section>

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData(qa)) }} />
    </article>
  );
}
