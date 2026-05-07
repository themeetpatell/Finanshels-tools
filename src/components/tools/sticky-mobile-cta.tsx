"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { site, whatsappHref } from "@/lib/config/site";
import { trackEvent } from "@/lib/analytics/track";

export function StickyMobileCta({
  whatsappMessage,
  toolSlug = "navigation",
}: {
  whatsappMessage: string;
  /** For analytics correlation — set to the active tool slug when known */
  toolSlug?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur print:hidden md:hidden">
      <div className="mx-auto flex max-w-xl gap-2">
        <Button asChild className="flex-1">
          <Link
            href={whatsappHref(whatsappMessage)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("whatsapp_cta_clicked", { toolSlug })}
          >
            WhatsApp
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link
            href={site.consultationUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("consultation_cta_clicked", { toolSlug })}
          >
            Book review
          </Link>
        </Button>
      </div>
    </div>
  );
}
