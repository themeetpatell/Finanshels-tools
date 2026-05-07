"use client";

import { Button } from "@/components/ui/button";

export function PrintReport({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Print-ready summary</p>
          <p className="text-sm text-muted-foreground">Use for internal sharing — exclude lead forms from print below.</p>
        </div>
        <Button variant="outline" className="hidden print:hidden sm:inline-flex" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>
      <div className="rounded-2xl border bg-card p-6 print:border-0 print:shadow-none">{children}</div>
    </div>
  );
}
