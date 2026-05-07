import { Info } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DisclaimerCard({
  title = "Important disclaimer",
  body,
  compact,
  className,
}: {
  title?: string;
  body: string;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <aside
        className={`flex gap-3 rounded-xl border border-navy-900/10 bg-navy-900/[0.03] px-4 py-3.5 shadow-sm ring-1 ring-black/[0.02] ${className ?? ""}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-[0.8125rem]">{body}</p>
      </aside>
    );
  }

  return (
    <Card className={`border-dashed bg-muted/30 ${className ?? ""}`}>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}
