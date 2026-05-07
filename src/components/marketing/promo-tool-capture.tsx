"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { clearPromotedToolSlug, setPromotedToolSlug } from "@/lib/toolkit-progress";
import type { ToolSlug } from "@/lib/tools/registry";

function PromoToolCaptureInner({ slug }: { slug: ToolSlug }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const flag = searchParams.get("promo");
    if (flag === "1") setPromotedToolSlug(slug);
    if (flag === "0") clearPromotedToolSlug();
  }, [searchParams, slug]);

  return null;
}

/** Call from each `/tools/[slug]` page. `?promo=1` unlocks this slug for the session without finishing prior steps. */
export function PromoToolCapture({ slug }: { slug: ToolSlug }) {
  return (
    <Suspense fallback={null}>
      <PromoToolCaptureInner slug={slug} />
    </Suspense>
  );
}
