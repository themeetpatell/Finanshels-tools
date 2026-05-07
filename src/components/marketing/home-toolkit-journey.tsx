import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CANONICAL_TOOL_SEQUENCE, FUNNEL_PHASES } from "@/lib/tools/canonical-sequence";
import type { ToolSlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

const SHORT_LABEL: Record<ToolSlug, string> = {
  "finance-maturity-score": "Maturity",
  "financial-health-checkup": "Health",
  "cashflow-health-checkup": "Cash",
  "corporate-tax-deadline-checker": "Tax timing",
  "hiring-vs-outsourcing-benchmark": "Hiring",
};

/**
 * Lighter companion to {@link HomeJourneyMap} — only the five-tool rail + two phases, minimal copy.
 */
export function HomeToolkitJourney() {
  const tools = CANONICAL_TOOL_SEQUENCE.map((slug) => ({ slug, label: SHORT_LABEL[slug] }));

  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-navy-900/[0.06] bg-gradient-to-br from-background via-card to-orange-light/[0.12] px-5 py-8 shadow-[0_16px_44px_-36px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.02] md:px-8 md:py-10",
      )}
      aria-labelledby="home-toolkit-journey-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-primary">Toolkit path</p>
        <h2 id="home-toolkit-journey-heading" className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          Five calculators, one unlock order
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
          Opens in order — snapshot tools first, then tax timing and hiring economics.
        </p>
      </div>

      <p className="mx-auto mt-5 text-center text-[11px] text-muted-foreground md:text-xs">
        <span className="font-semibold tabular-nums text-foreground">{CANONICAL_TOOL_SEQUENCE.length}</span> steps ·{" "}
        <span className="tabular-nums text-foreground/90">
          {FUNNEL_PHASES[0]!.tools.length}+{FUNNEL_PHASES[1]!.tools.length}
        </span>
        <span className="sr-only"> Five tools grouped as three snapshot calculators plus two planning calculators.</span>
      </p>

      <div className="relative mx-auto mt-8 max-w-3xl">
        <ToolkitRailSvg />
        <ol className="mt-4 flex justify-between gap-1 overflow-x-auto pb-1 text-center md:mt-5" aria-label="Calculator order">
          {tools.map((t, i) => (
            <li key={t.slug} className="min-w-[4.5rem] flex-1 md:min-w-0">
              <span className="block text-[10px] font-bold tabular-nums text-primary md:text-[11px]">{i + 1}</span>
              <span className="mt-1 block truncate text-[11px] font-medium text-foreground md:text-xs">{t.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-7 flex justify-center">
        <Button asChild variant="outline" size="sm" className="border-navy-900/14 bg-background/90">
          <Link href="/tools">Open toolkit</Link>
        </Button>
      </div>
    </section>
  );
}

/** Simple horizontal rail — five stops, thinner than {@link JourneySvgDesktop} */
function ToolkitRailSvg() {
  const n = CANONICAL_TOOL_SEQUENCE.length;
  const w = 520;
  const pad = 28;
  const y = 22;
  const usable = w - pad * 2;
  const step = n > 1 ? usable / (n - 1) : 0;

  return (
    <figure className="mx-auto hidden w-full max-w-[32rem] md:block" aria-hidden>
      <svg viewBox={`0 0 ${w} 52`} className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
        <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#082032" strokeOpacity={0.12} strokeWidth={4} strokeLinecap="round" />
        <line
          x1={pad}
          y1={y}
          x2={w - pad}
          y2={y}
          stroke="#f16611"
          strokeOpacity={0.55}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 10"
        />
        {CANONICAL_TOOL_SEQUENCE.map((_, i) => {
          const cx = pad + step * i;
          return (
            <g key={i}>
              <circle cx={cx} cy={y} r={7} fill="#ffffff" stroke="#f16611" strokeWidth={2} />
              <circle cx={cx} cy={y} r={3} fill="#f16611" opacity={0.35} />
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">Line with five numbered stops showing the toolkit sequence.</figcaption>
    </figure>
  );
}
