import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max?: number;
  label: string;
  /** Optional secondary line under the heading (e.g. band name) */
  sublabel?: string;
  className?: string;
};

/**
 * Prominent numeric score with a simple ring visual — screen-first, prints adequately.
 */
export function ScoreHighlight({ value, max = 100, label, sublabel, className }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center", className)}>
      <div className="relative size-28 shrink-0" role="img" aria-label={`${label}: ${value} out of ${max}`}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${pct}%, var(--muted) ${pct}% 100%)`,
          }}
        />
        <div className="absolute inset-[5px] flex flex-col items-center justify-center rounded-full bg-card shadow-sm">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">/ {max}</span>
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel ? <p className="text-sm text-muted-foreground">{sublabel}</p> : null}
      </div>
    </div>
  );
}
