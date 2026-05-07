import Link from "next/link";

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { funnelPhaseMetaForSlug } from "@/lib/tools/canonical-sequence";
import type { ToolDefinition } from "@/lib/tools/registry";

export function NextTools({ tools }: { tools: ToolDefinition[] }) {
  if (tools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No follow-on tools queued</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the full library — tracks are suggestions, not hard gates.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/tools">Browse all tools</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <Card key={t.slug} className="shadow-sm">
          <CardHeader className="gap-2 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{t.title}</CardTitle>
              <Badge variant="outline" className="font-normal text-[10px]">
                Part {funnelPhaseMetaForSlug(t.slug).phase}
              </Badge>
            </div>
            <CardDescription className="leading-relaxed">{t.purpose}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button asChild className="w-full">
              <Link href={`/tools/${t.slug}`}>Open tool</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
