import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { site, whatsappHref } from "@/lib/config/site";
import { cn } from "@/lib/utils";

const waDefaultMessage = "Hi — I used Finance Navigator and want to discuss next steps.";

export function SiteFooter() {
  const wa = whatsappHref(waDefaultMessage);

  return (
    <footer className="mt-auto print:hidden">
      <section
        aria-label="Finance Navigator introduction"
        className="relative overflow-hidden bg-navy-900 text-[color:var(--cream)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_140%_at_100%_-25%,rgba(241,102,17,0.28),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_0%_110%,rgba(255,255,255,0.07),transparent_50%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-3 py-12 sm:px-4 md:py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-xl space-y-5">
              <div>
                <Link
                  href="/"
                  className="inline-block text-xl font-semibold tracking-[-0.02em] text-white transition hover:text-white/90 md:text-2xl"
                >
                  {site.name}
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-white/[0.72] md:text-[0.95rem]">
                  {site.tagline}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:items-stretch lg:w-auto lg:flex-col xl:flex-row">
              <Button
                asChild
                className="h-11 min-h-11 border-0 bg-primary px-6 text-[0.9375rem] font-semibold text-primary-foreground shadow-[0_12px_36px_-14px_rgba(241,102,17,0.75)] hover:bg-[#d95c0f] sm:flex-1 lg:flex-none xl:flex-1"
              >
                <Link href="/assessment">Start assessment</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 min-h-11 border-white/20 bg-white/[0.06] px-6 text-[0.9375rem] font-semibold text-[color:var(--cream)] backdrop-blur-sm hover:bg-white/[0.12] hover:text-white sm:flex-1 lg:flex-none xl:flex-1 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <Link href="/tools">Toolkit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="fn-footer-main border-t border-navy-900/[0.07]">
        <div className="mx-auto max-w-6xl px-3 py-10 sm:px-4 md:py-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 xl:gap-20">
            <div className="max-w-md shrink-0 lg:pt-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Talk to the team</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Filings, structure, or scaling finance — reach the {site.company} team.
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:grid-cols-2 xl:gap-4">
                <FooterContactCard
                  href={`tel:${site.phoneTel}`}
                  icon={Phone}
                  eyebrow="Phone"
                  primary={site.phoneDisplay}
                  secondary="Dubai · weekdays"
                />
                <FooterContactCard
                  href="mailto:hello@finanshels.com"
                  icon={Mail}
                  eyebrow="Email"
                  primary="hello@finanshels.com"
                  secondary="Within one business day"
                />
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex min-h-[5.75rem] items-center justify-center gap-2 rounded-2xl px-5 py-4 text-center text-sm font-semibold",
                    "bg-primary text-primary-foreground shadow-[0_14px_40px_-18px_rgba(241,102,17,0.85)] transition",
                    "hover:bg-[#d95c0f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <MessageCircle className="size-5 shrink-0" aria-hidden />
                  WhatsApp
                  <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
                </a>
                <a
                  href={site.consultationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex min-h-[5.75rem] items-center justify-center gap-2 rounded-2xl border-2 border-navy-900/[0.09] bg-card px-5 py-4 text-sm font-semibold text-navy-900 shadow-[0_8px_28px_-22px_rgba(8,32,50,0.45)] transition",
                    "hover:border-primary/40 hover:bg-orange-light/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900/30",
                  )}
                >
                  <Calendar className="size-[1.125rem] shrink-0 text-primary" aria-hidden />
                  Book consultation
                  <ExternalLink className="size-3.5 shrink-0 opacity-45" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-navy-900/10 bg-white/50 py-8 pb-10 backdrop-blur-[2px] sm:pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-3 sm:px-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground md:text-[0.8125rem]">
            Outputs are directional and for planning conversations only — not legal, tax, or investment advice. UAE rules evolve; confirm material
            choices with qualified advisors.
          </p>
          <p className="shrink-0 text-xs tabular-nums text-foreground/75 md:text-[0.8125rem]">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterContactCard({
  href,
  icon: Icon,
  eyebrow,
  primary,
  secondary,
}: {
  href: string;
  icon: LucideIcon;
  eyebrow: string;
  primary: string;
  secondary: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-navy-900/[0.08] bg-card/95 p-4 shadow-[0_8px_28px_-24px_rgba(8,32,50,0.4)] ring-1 ring-black/[0.02] transition",
        "hover:border-primary/35 hover:bg-white hover:shadow-[0_14px_36px_-26px_rgba(8,32,50,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
      )}
    >
      <span className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {eyebrow}
      </span>
      <span className="break-words text-sm font-semibold tracking-tight text-foreground">{primary}</span>
      <span className="text-xs leading-snug text-muted-foreground">{secondary}</span>
    </a>
  );
}
