"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { HeaderProfile } from "@/components/layout/header-profile";
import { site } from "@/lib/config/site";

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const onAssessment = pathname === "/assessment" || pathname.startsWith("/assessment/");

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#061520]/92 pt-[env(safe-area-inset-top)] text-white shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex min-h-[3.5rem] w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:min-h-[3.75rem] sm:gap-4 sm:px-4 sm:py-0">
        <Link
          href="/"
          className="min-w-0 max-w-[calc(100%-10.25rem)] truncate text-left text-[0.8125rem] font-semibold tracking-[-0.02em] text-white transition hover:text-white/90 sm:max-w-[min(62vw,15rem)] sm:text-[0.95rem] md:max-w-none md:overflow-visible md:whitespace-normal"
        >
          {site.name}
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <HeaderProfile />

          {onAssessment ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 border-white/30 bg-transparent px-2.5 text-white hover:bg-white/10 hover:text-white sm:px-2.5"
            >
              <Link href="/tools">
                <span className="sm:hidden">Toolkit</span>
                <span className="hidden sm:inline">Open toolkit</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-primary px-2.5 text-primary-foreground hover:bg-[#d95c0f] sm:px-2.5"
            >
              <Link href="/assessment">
                <span className="sm:hidden">Assessment</span>
                <span className="hidden sm:inline">Start assessment</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
