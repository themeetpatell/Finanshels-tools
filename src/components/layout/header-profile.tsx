"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/config/site";
import {
  clearLeadIdentity,
  firstNameFromFullName,
  leadIdentityEventName,
  readLeadIdentity,
  type StoredLeadIdentity,
} from "@/lib/lead-identity-storage";

export function HeaderProfile() {
  const [mounted, setMounted] = useState(false);
  const [rev, setRev] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const ev = leadIdentityEventName();
    const onBump = () => setRev((x) => x + 1);
    window.addEventListener(ev, onBump);
    return () => window.removeEventListener(ev, onBump);
  }, []);

  const profile: StoredLeadIdentity | null = useMemo(() => {
    if (!mounted) return null;
    return readLeadIdentity();
  }, [mounted, rev]);

  const signOut = useCallback(() => {
    clearLeadIdentity();
    setOpen(false);
    window.location.reload();
  }, []);

  if (!mounted) {
    return (
      <div className="h-7 w-9 shrink-0 animate-pulse rounded-lg bg-white/10 sm:h-9 sm:w-24" aria-hidden />
    );
  }

  const label = profile
    ? firstNameFromFullName(profile.fullName) || profile.workEmail.split("@")[0] || "Profile"
    : site.company;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? `${label}, menu open` : `${label}, open menu`}
        className="gap-1 border border-white/15 bg-white/5 px-2 text-white hover:bg-white/10 hover:text-white sm:gap-1.5 sm:px-3"
        onClick={() => setOpen((o) => !o)}
      >
        <User className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        <span className="hidden max-w-[6.5rem] truncate text-[0.8rem] font-medium sm:inline sm:max-w-[8rem] sm:text-sm">
          {label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[45] cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Menu"
            className="absolute right-0 z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-navy-900 shadow-xl ring-1 ring-black/40"
          >
            {profile ? (
              <div className="border-b border-white/10 p-4">
                <p className="truncate text-sm font-semibold text-white">{profile.fullName}</p>
                <p className="mt-1 truncate text-xs text-white/65">{profile.workEmail}</p>
              </div>
            ) : null}
            <div className="flex flex-col gap-1 p-2">
              <Button
                asChild
                variant="ghost"
                className="justify-start text-white hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <a href={`tel:${site.phoneTel}`} className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" aria-hidden />
                  {site.phoneDisplay}
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="justify-start text-white hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <Link href="/tools">Toolkit</Link>
              </Button>
              {profile ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start text-red-300 hover:bg-red-950/50 hover:text-red-50"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Sign out
                </Button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
