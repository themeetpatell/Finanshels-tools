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

  return (
    <section className="space-y-2" aria-labelledby={labelId}>
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span id={labelId}>{label}</span>
        <span aria-live="polite">{stateLabel}</span>
      </div>
      <Progress value={pct} aria-label={`${label} progress ${pct}%`} />
    </section>
  );
}
