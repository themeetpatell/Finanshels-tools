"use client";

import { useEffect, useReducer, useSyncExternalStore } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";
import {
  firstBlockingSlug,
  getPromotedToolSlug,
  isToolUnlocked,
  promoUnlockEventName,
  toolSequenceIndex,
} from "@/lib/toolkit-progress";
import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

function useClientHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function PromoCampaignNotice({ slug }: { slug: ToolSlug }) {
  if (getPromotedToolSlug() !== slug) return null;

  return (
    <aside className="mb-8 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground md:px-5">
      <p className="text-muted-foreground">
        Direct link — other tools still unlock in order from the{" "}
        <Link href="/tools" className="font-medium text-primary underline-offset-4 hover:underline">
          toolkit hub
        </Link>
        .
      </p>
    </aside>
  );
}

export function ToolSequenceGate({
  slug,
  children,
}: {
  slug: ToolSlug;
  children: React.ReactNode;
}) {
  const [, redraw] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const onPromo = () => redraw();
    window.addEventListener(promoUnlockEventName(), onPromo);
    return () => window.removeEventListener(promoUnlockEventName(), onPromo);
  }, []);

  const hydrated = useClientHydrated();

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-10 max-w-xl animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/80" />
      </div>
    );
  }

  if (!isToolUnlocked(slug)) {
    const block = firstBlockingSlug(slug);
    const blockerDef = block ? TOOLS_BY_SLUG[block] : null;
    const stepNo = toolSequenceIndex(slug) + 1;
    return (
      <Card className="border-primary/35 bg-card">
        <CardHeader>
          <CardTitle>Complete the earlier steps first</CardTitle>
          <CardDescription>
            This tool is step {stepNo} of {CANONICAL_TOOL_SEQUENCE.length} in the guided path. Complete the earlier steps first.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {blockerDef ? (
            <p>
              Next: <strong className="text-foreground">{blockerDef.title}</strong>.
            </p>
          ) : (
            <p>Open the toolkit hub below and work through the steps in order.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href={block ? `/tools/${block}` : "/tools"}>{block ? `Go to · ${TOOLS_BY_SLUG[block].title}` : "Toolkit hub"}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/assessment">Assessment</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <PromoCampaignNotice slug={slug} />
      {children}
    </>
  );
}
