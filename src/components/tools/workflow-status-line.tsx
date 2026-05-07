type Phase = "inputs" | "results";

/**
 * Replaces arbitrary progress percentages on single-screen tools with an explicit status line.
 */
export function WorkflowStatusLine({ phase, detail }: { phase: Phase; detail?: string }) {
  const copy =
    phase === "results"
      ? "Results are below — use export or WhatsApp when you are ready to escalate."
      : detail ?? "Complete the fields, then generate your snapshot. Values can be ballpark AED estimates.";

  return (
    <p className="border-l-2 border-primary/35 pl-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
  );
}
