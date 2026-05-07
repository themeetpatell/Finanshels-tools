"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { TRACK_LABELS } from "@/lib/tools/tracks";
import { canonicalSequenceDefinitions } from "@/lib/tools/canonical-sequence";

const STEPS = canonicalSequenceDefinitions();

export function ToolsSequentialJourney() {
  const [idx, setIdx] = useState(0);
  const total = STEPS.length;
  const current = STEPS[idx]!;
  const progress = Math.round(((idx + 1) / total) * 100);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIdx((i) => Math.min(total - 1, i + 1)), [total]);

  const trackCopy = useMemo(() => TRACK_LABELS[current.trackId], [current.trackId]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
          <span>Toolkit step {idx + 1} of {total}</span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{trackCopy.title}</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={`Step ${idx + 1} of ${total}`} />
      </div>

      <nav aria-label="Toolkit steps" className="flex flex-wrap gap-2">
        {STEPS.map((t, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => setIdx(i)}
              className={
                active
                  ? "min-w-9 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
                  : done
                    ? "min-w-9 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                    : "min-w-9 rounded-full border border-dashed border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60"
              }
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 border-b border-border/60 bg-card">
          <CardTitle className="text-2xl tracking-tight">{current.title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{current.purpose}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Complete this pass in about <span className="font-medium text-foreground">{current.etaMinutes} minutes</span>, then use{" "}
            <strong>Next step</strong> to continue the sequence. Navigator is built as a funnel — not a pick-and-mix menu.
          </p>
          <p className="text-xs text-muted-foreground">
            Track context: {trackCopy.subtitle}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/60 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" size="lg" onClick={goPrev} disabled={idx === 0} className="flex-1 sm:flex-initial">
              <ChevronLeft className="mr-1 size-4" aria-hidden />
              Previous
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={goNext} disabled={idx >= total - 1} className="flex-1 sm:flex-initial">
              Next step
              <ChevronRight className="ml-1 size-4" aria-hidden />
            </Button>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/tools/${current.slug}`}>Open this tool</Link>
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Prefer the guided route first?{" "}
        <Link href="/assessment" className="font-medium text-primary underline-offset-4 hover:underline">
          Run the Finance Navigator Assessment
        </Link>{" "}
        — we will sequence tools to match your situation.
      </p>
    </div>
  );
}
