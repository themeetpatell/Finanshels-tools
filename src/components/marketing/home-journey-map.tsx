import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: 1,
    title: "Readiness check",
    caption: "~2 minutes. Mainland vs free zone, filings, priorities.",
  },
  {
    n: 2,
    title: "Routed toolkit",
    caption: "We suggest which calculators to open first.",
  },
  {
    n: 3,
    title: "Run in order",
    caption: "Each tool builds context for the next — no skipping ahead.",
  },
  {
    n: 4,
    title: "Outputs & follow-up",
    caption: "Save results, optional email readout, talk to the team if you want help.",
  },
] as const;

/**
 * Decorative journey map SVG + captions — illustrates the funnel without duplicating footer nav clutter.
 */
export function HomeJourneyMap() {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-navy-900/[0.07] bg-card px-5 py-12 shadow-[0_24px_60px_-40px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.03] md:px-10 md:py-14",
      )}
      aria-labelledby="home-journey-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-12 h-64 w-64 rounded-full bg-primary/[0.09] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-navy-900/[0.06] blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Journey map</p>
        <h2 id="home-journey-heading" className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          From first click to actionable outputs
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
          Finance Navigator is designed as a linear path — clarity first, calculators second, decisions last.
        </p>
      </div>

      <div className="relative mx-auto mt-10 max-w-5xl">
        <figure className="mx-auto hidden w-full max-w-[52rem] md:block" aria-hidden>
          <JourneySvgDesktop />
          <figcaption className="sr-only">
            Illustration of four stages: readiness check, routed toolkit, run in order, outputs and follow-up, connected along a curved path.
          </figcaption>
        </figure>

        <ol className="mt-2 grid gap-4 sm:grid-cols-2 md:hidden" aria-label="Journey stages">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex gap-4 rounded-2xl border border-navy-900/[0.08] bg-gradient-to-br from-background to-orange-light/[0.2] p-4 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
                {s.n}
              </span>
              <div className="min-w-0 text-left">
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.caption}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="mt-10 hidden md:grid md:grid-cols-4 md:gap-4 lg:gap-5" aria-label="Journey stage details">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-navy-900/[0.06] bg-background/80 px-4 py-3 text-center shadow-[0_8px_24px_-20px_rgba(8,32,50,0.35)] backdrop-blur-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step {s.n}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{s.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.caption}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="min-h-11 min-w-[180px] shadow-md shadow-primary/20">
          <Link href="/assessment">Start the check</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11 min-w-[180px] border-navy-900/14 bg-background/70">
          <Link href="/tools">See toolkit</Link>
        </Button>
      </div>
    </section>
  );
}

/** Curved metro-style route with four stops — strokes use CSS currentColor tokens via inline SVG fills where needed */
function JourneySvgDesktop() {
  return (
    <svg viewBox="0 0 820 220" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="journey-route-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f16611" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#f16611" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#082032" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Wide arc path */}
      <path
        d="M 60 148 C 180 52, 320 240, 410 136 S 620 44, 760 148"
        fill="none"
        stroke="url(#journey-route-glow)"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 60 148 C 180 52, 320 240, 410 136 S 620 44, 760 148"
        fill="none"
        stroke="#f16611"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="10 14"
        opacity="0.9"
      />

      {/* Stops */}
      <Stop cx={60} cy={148} n={1} />
      <Stop cx={274} cy={108} n={2} />
      <Stop cx={410} cy={136} n={3} />
      <Stop cx={760} cy={148} n={4} />

      {/* Small route pins */}
      <CircleLabels />
    </svg>
  );
}

function Stop({ cx, cy, n }: { cx: number; cy: number; n: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={26} fill="#ffffff" stroke="#f16611" strokeWidth={2.5} />
      <text
        x={cx}
        y={cy}
        dominantBaseline="central"
        textAnchor="middle"
        fill="#082032"
        style={{ fontSize: 17, fontWeight: 700, fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
      >
        {n}
      </text>
    </g>
  );
}

function CircleLabels() {
  const labels = STEPS.map((s, i) => {
    const positions: readonly [number, number][] = [
      [60, 188],
      [274, 152],
      [410, 176],
      [760, 188],
    ];
    const [x, y] = positions[i]!;
    return { ...s, x, y };
  });

  return (
    <>
      {labels.map((l) => (
        <text
          key={l.n}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fill="#082032"
          opacity={0.88}
          style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
        >
          {l.title}
        </text>
      ))}
    </>
  );
}
