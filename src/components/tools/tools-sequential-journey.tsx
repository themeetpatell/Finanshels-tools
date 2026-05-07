"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useToolkitProgress } from "@/hooks/use-toolkit-progress";
import { TRACK_LABELS } from "@/lib/tools/tracks";
import { CANONICAL_TOOL_SEQUENCE, FUNNEL_PHASES, funnelPhaseForSlug } from "@/lib/tools/canonical-sequence";
import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

const STEPS = CANONICAL_TOOL_SEQUENCE.map((slug) => TOOLS_BY_SLUG[slug]);

export function ToolsSequentialJourney() {
  const completed = useToolkitProgress();
  const doneSet = useMemo(() => new Set(completed), [completed]);

  const maxNavIdx = useMemo(() => {
    const frontier = STEPS.findIndex((t) => !doneSet.has(t.slug));
    if (frontier === -1) return STEPS.length - 1;
    return frontier;
  }, [doneSet]);

  const [idx, setIdx] = useState(0);
  const displayIdx = Math.min(Math.max(idx, 0), maxNavIdx);
  const current = STEPS[displayIdx]!;
  const total = STEPS.length;
  const progress = Math.round(((displayIdx + 1) / total) * 100);
  const currentPhase = funnelPhaseForSlug(current.slug);
  const phaseMeta = FUNNEL_PHASES.find((p) => p.phase === currentPhase)!;
  const stepWithinPart = Math.max(1, phaseMeta.tools.indexOf(current.slug as ToolSlug) + 1);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIdx((i) => Math.min(maxNavIdx, i + 1)), [maxNavIdx]);

  const trackCopy = useMemo(() => TRACK_LABELS[current.trackId], [current.trackId]);

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-5 md:px-6">
        <p className="text-sm font-semibold text-foreground">How this toolkit is organised</p>
        <div className="grid gap-4 md:grid-cols-2">
          {FUNNEL_PHASES.map((p) => (
            <div key={p.phase} className="space-y-1.5 text-sm">
              <p className="font-medium text-foreground">
                Part {p.phase} · {p.visitorTitle}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.visitorSummary}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.visitorDescription}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 text-sm font-medium text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span className="min-w-0 leading-snug">
            <span className="block sm:inline">
              Step {displayIdx + 1} of {total}
              <span className="text-muted-foreground/80"> · </span>
            </span>
            <span className="block sm:inline">
              Part {currentPhase}, {stepWithinPart} of {phaseMeta.tools.length} in section
            </span>
          </span>
          <span className="w-fit shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{trackCopy.title}</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={`Step ${displayIdx + 1} of ${total}`} />
      </div>

      <nav aria-label="Toolkit steps" className="space-y-6">
        {FUNNEL_PHASES.map((phase) => (
          <div key={phase.phase} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
              Part {phase.phase} — {phase.visitorTitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {phase.tools.map((slug) => {
                const globalIdx = STEPS.findIndex((s) => s.slug === slug);
                const i = globalIdx >= 0 ? globalIdx : 0;
                const t = TOOLS_BY_SLUG[slug];
                const active = i === displayIdx;
                const done = doneSet.has(slug);
                const locked = i > maxNavIdx;
                const pillCls = locked
                  ? "inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
                  : active
                    ? "inline-flex min-w-9 items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
                    : done
                      ? "inline-flex min-w-9 items-center justify-center rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                      : "inline-flex min-w-9 items-center justify-center rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/60";

                return (
                  <button
                    key={slug}
                    type="button"
                    aria-disabled={locked}
                    aria-label={`${t.title}${locked ? " (locked)" : ""}${done ? " completed" : ""}`}
                    title={
                      locked ? `Finish the earlier steps first (next: ${STEPS[maxNavIdx]?.title ?? ""})` : t.title
                    }
                    onClick={() => {
                      if (!locked) setIdx(i);
                    }}
                    disabled={locked}
                    className={pillCls}
                  >
                    {locked ? <Lock className="size-3.5 shrink-0" aria-hidden /> : null}
                    <span aria-hidden>{i + 1}</span>
                    {done && !locked ? <span className="sr-only">completed</span> : null}
                    <span className="hidden sm:inline">{`: ${t.title}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 border-b border-border/60 bg-card">
          <CardTitle className="text-xl tracking-tight sm:text-2xl">{current.title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{current.purpose}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tools unlock in order. Complete each step to open the next — you can revisit and change inputs anytime.
          </p>
          <p className="text-xs text-muted-foreground">Topic lens: {trackCopy.subtitle}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/60 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" size="lg" onClick={goPrev} disabled={displayIdx === 0} className="flex-1 sm:flex-initial">
              <ChevronLeft className="mr-1 size-4" aria-hidden />
              Previous
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={goNext} disabled={displayIdx >= maxNavIdx} className="flex-1 sm:flex-initial">
              Next step
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Button>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto" variant={doneSet.has(current.slug) ? "default" : "secondary"}>
            <Link href={`/tools/${current.slug}`}>{doneSet.has(current.slug) ? "Re-open tool" : "Open current step"}</Link>
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        If you took the Assessment, it may highlight certain tools first — this page still walks you through each step so nothing jumps ahead without context.
      </p>
    </div>
  );
}
