export function ReportPrintHeader({ tool, subtitle }: { tool: string; subtitle: string }) {
  return (
    <header className="space-y-1">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{tool}</p>
      <h2 className="text-xl font-semibold">{subtitle}</h2>
    </header>
  );
}
