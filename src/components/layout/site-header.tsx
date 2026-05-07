import Link from "next/link";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/config/site";

const nav = [
  { href: "/", label: "Home" },
  { href: "/assessment", label: "Assessment" },
  { href: "/tools", label: "Toolkit" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900 text-white print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-white">{site.name}</span>
          <span className="hidden text-xs text-white/65 sm:inline">by {site.company}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            <Link href="/tools">Toolkit sequence</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-[#d95c0f]">
            <Link href="/assessment">Start assessment</Link>
          </Button>
        </div>
      </div>
      <div className="border-t border-white/10 bg-navy-900 md:hidden">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-3 pb-2 pt-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/90"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
