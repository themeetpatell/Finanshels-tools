"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FormField } from "@/components/forms/form-field";
import { trackEvent } from "@/lib/analytics/track";
import { leadIdentifySchema } from "@/lib/validators/lead-identify";
import {
  writeLeadIdentity,
  readLeadIdentity,
  leadIdentityEventName,
  type StoredLeadIdentity,
} from "@/lib/lead-identity-storage";
import type { ToolSlug } from "@/lib/tools/registry";
import { site } from "@/lib/config/site";

const COPY = {
  assessment_entry: {
    title: "Before we begin",
    subtitle: "A few details so we can route your readiness check.",
  },
  toolkit_hub: {
    title: "Access the calculators",
    subtitle: "One quick form — then the toolkit unlocks.",
  },
  tool_entry: {
    title: "Open this calculator",
    subtitle: "We’ll associate results with your company if you get in touch.",
  },
} as const;

type Props = {
  funnelContext: keyof typeof COPY;
  sourceToolSlug?: ToolSlug;
  children: React.ReactNode;
};

type FormVals = Pick<z.infer<typeof leadIdentifySchema>, "fullName" | "workEmail" | "companyName" | "companySize" | "consentAccepted">;

export function LeadIdentifyGate({ funnelContext, sourceToolSlug, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [identityRevision, setIdentityRevision] = useState(0);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const ev = leadIdentityEventName();
    const onBump = () => setIdentityRevision((x) => x + 1);
    window.addEventListener(ev, onBump);
    return () => window.removeEventListener(ev, onBump);
  }, []);

  const profile = mounted ? readLeadIdentity() : null;

  const form = useForm<FormVals>({
    resolver: zodResolver(
      leadIdentifySchema.pick({
        fullName: true,
        workEmail: true,
        companyName: true,
        companySize: true,
        consentAccepted: true,
      }),
    ) as Resolver<FormVals>,
    defaultValues: {
      fullName: profile?.fullName ?? "",
      workEmail: profile?.workEmail ?? "",
      companyName: profile?.companyName ?? "",
      companySize: profile?.companySize ?? undefined,
      consentAccepted: false,
    },
  });

  /**
   * Hydrate the identify form from localStorage when it first appears, or when another tab updates storage.
   * Avoid depending on `profile` (new object every read) — that plus form.reset caused a maximum update depth loop.
   */
  useEffect(() => {
    if (!mounted) return;
    const p = readLeadIdentity();
    if (!p) return;
    const v = form.getValues();
    if (
      v.fullName === p.fullName &&
      v.workEmail === p.workEmail &&
      v.companyName === p.companyName &&
      v.companySize === p.companySize &&
      v.consentAccepted === true
    ) {
      return;
    }
    form.reset({
      fullName: p.fullName,
      workEmail: p.workEmail,
      companyName: p.companyName,
      companySize: p.companySize,
      consentAccepted: true,
    });
  }, [mounted, identityRevision, form]);

  async function onSubmit(values: FormVals) {
    setSubmitErr(null);
    try {
      const res = await fetch("/api/leads/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          funnelContext,
          sourceToolSlugHint: sourceToolSlug,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !json?.ok) {
        throw new Error("identify_failed");
      }
      writeLeadIdentity({
        fullName: values.fullName.trim(),
        workEmail: values.workEmail.trim().toLowerCase(),
        companyName: values.companyName.trim(),
        companySize: values.companySize,
      } satisfies Omit<StoredLeadIdentity, "savedAt">);
      trackEvent("lead_identification_submitted", {
        funnelContext,
        sourceToolSlug: sourceToolSlug ?? null,
      });
    } catch {
      setSubmitErr("Something went wrong. Check your connection and try again.");
    }
  }

  const copy = COPY[funnelContext];
  const err = form.formState.errors;

  if (!mounted) {
    return (
      <div className="space-y-6 pb-24" aria-busy="true">
        <div className="h-10 max-w-xl animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/80" />
      </div>
    );
  }

  if (readLeadIdentity()) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      <Card className="overflow-visible shadow-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl tracking-tight sm:text-2xl">{copy.title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">{copy.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="grid min-w-0 gap-5 md:grid-cols-2 md:gap-6">
              <FormField id="ident-fullName" label="Full name" error={err.fullName?.message}>
                <Input autoComplete="name" {...form.register("fullName")} />
              </FormField>
              <FormField id="ident-workEmail" label="Work email" error={err.workEmail?.message}>
                <Input type="email" autoComplete="email" {...form.register("workEmail")} />
              </FormField>
              <div className="md:col-span-2">
                <FormField id="ident-companyName" label="Company name" error={err.companyName?.message}>
                  <Input autoComplete="organization" {...form.register("companyName")} />
                </FormField>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="ident-companySize">Company headcount</Label>
                <Select
                  value={form.watch("companySize") ?? undefined}
                  onValueChange={(v) => {
                    if (typeof v !== "string") return;
                    form.setValue("companySize", v as FormVals["companySize"], { shouldValidate: true });
                  }}
                >
                  <SelectTrigger id="ident-companySize" className="w-full" aria-invalid={Boolean(err.companySize)}>
                    <SelectValue placeholder="Select a range">
                      {(val: unknown) => headcountLabel(val as FormVals["companySize"] | undefined)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1–5 employees</SelectItem>
                    <SelectItem value="6-20">6–20 employees</SelectItem>
                    <SelectItem value="21-50">21–50 employees</SelectItem>
                    <SelectItem value="51-200">51–200 employees</SelectItem>
                    <SelectItem value="201-plus">201+ employees</SelectItem>
                  </SelectContent>
                </Select>
                {err.companySize?.message ? (
                  <p role="alert" className="text-xs text-destructive">
                    {String(err.companySize.message)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ident-consent"
                  checked={form.watch("consentAccepted") ?? false}
                  onCheckedChange={(v) => form.setValue("consentAccepted", Boolean(v), { shouldValidate: true })}
                  aria-invalid={Boolean(err.consentAccepted)}
                />
                <label htmlFor="ident-consent" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Contact consent</span> — {site.company} may reach out about this submission. Outputs are
                  directional estimates and not legal or tax advice.
                </label>
              </div>
              {err.consentAccepted?.message ? (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {String(err.consentAccepted.message)}
                </p>
              ) : null}
            </div>

            {submitErr ? (
              <p role="alert" className="text-sm text-destructive">
                {submitErr}
              </p>
            ) : null}

            <CardFooter className="flex flex-wrap gap-3 px-0">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Continue"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Trouble submitting?{" "}
        <a href="mailto:hello@finanshels.com" className="font-medium text-primary underline-offset-4 hover:underline">
          hello@finanshels.com
        </a>
      </p>
    </div>
  );
}

function headcountLabel(v: FormVals["companySize"] | undefined): string {
  const m: Record<string, string> = {
    "1-5": "1–5 employees",
    "6-20": "6–20 employees",
    "21-50": "21–50 employees",
    "51-200": "51–200 employees",
    "201-plus": "201+ employees",
  };
  return (v && m[v]) || "Select a range";
}
