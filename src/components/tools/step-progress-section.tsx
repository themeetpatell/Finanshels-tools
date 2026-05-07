import { Progress } from "@/components/ui/progress";

type Props = {
  /** Stable id for `aria-labelledby` on the section */
  labelId: string;
  label: string;
  stepIndex: number;
  stepCount: number;
  submitted: boolean;
  /** e.g. "Step 1 of 3" vs "Complete" */
  stateHint?: string;
};

export function StepProgressSection({
  labelId,
  label,
  stepIndex,
  stepCount,
  submitted,
  stateHint,
}: Props) {
  const pct = submitted ? 100 : Math.round(((stepIndex + 1) / stepCount) * 100);
  const stateLabel =
    stateHint ?? (submitted ? "Complete" : `Step ${stepIndex + 1} of ${stepCount}`);

  const current = submitted ? stepCount : stepIndex + 1;

  return (
    <section
      className="rounded-2xl border border-navy-900/[0.08] bg-gradient-to-br from-white via-card to-orange-light/30 p-5 shadow-[0_16px_40px_-28px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.03] sm:p-6"
      aria-labelledby={labelId}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <span
            id={labelId}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
          >
            {label}
          </span>
          <p className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {stateLabel}
          </p>
        </div>

        <ol className="flex items-center gap-2" aria-hidden>
          {Array.from({ length: stepCount }, (_, i) => {
            const n = i + 1;
            const done = submitted || n < current;
            const active = !submitted && n === current;
            return (
              <li key={n} className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors",
                    done
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : active
                        ? "bg-navy-900 text-white ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border border-border bg-muted/60 text-muted-foreground",
                  ].join(" ")}
                >
                  {done && !active ? "✓" : n}
                </span>
                {n < stepCount ? (
                  <span
                    className={`hidden h-0.5 w-6 rounded-full sm:block ${done ? "bg-primary/50" : "bg-border"}`}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5">
        <Progress value={pct} className="h-2 bg-navy-900/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-[#ff9428]" aria-label={`${label} progress ${pct}%`} />
      </div>
    </section>
  );
}
