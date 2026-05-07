"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { whatsappHref, site } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/track";

export function CtaRow({
  toolSlug,
  whatsappMessage,
  prominent,
}: {
  toolSlug: string;
  whatsappMessage: string;
  /** Highlights the conversion row on dense result pages */
  prominent?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        prominent && "rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5",
      )}
    >
      <Button asChild size="lg">
        <Link
          href={whatsappHref(whatsappMessage)}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent("whatsapp_cta_clicked", { toolSlug })}
        >
          WhatsApp Finanshels
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link
          href={site.consultationUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent("consultation_cta_clicked", { toolSlug })}
        >
          Book expert review
        </Link>
      </Button>
    </div>
  );
}
