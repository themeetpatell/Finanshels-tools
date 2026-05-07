import Link from "next/link";

import { Button } from "@/components/ui/button";
import { site, whatsappHref } from "@/lib/config/site";
import { Phone, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">{site.company}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Finance Navigator delivers assessment-led tools that turn operational inputs into boardroom-useful next steps for UAE
            businesses.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Navigate</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/tools">
                Tools library
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/how-it-works">
                How results work
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/assessment">
                Guided assessment
              </Link>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background p-5">
          <p className="text-sm font-semibold">Talk with Finanshels</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Want a second opinion on filings, structure, or scaling finance? Reach the team directly.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild>
              <Link href={whatsappHref("Hi Finanshels — I used Finance Navigator and want to discuss next steps.")}>WhatsApp finanshels</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={site.consultationUrl}>Book expert review</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start px-2 text-muted-foreground">
              <Link href="mailto:hello@finanshels.com" className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                hello@finanshels.com
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start px-2 text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +971 formats supported
              </span>
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="leading-relaxed">
            Estimators produce directional guidance only. They are not legal, tax, or investment advice. UAE rules evolve — confirm
            material decisions with qualified advisors.
          </p>
          <p>© {new Date().getFullYear()} {site.company}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
