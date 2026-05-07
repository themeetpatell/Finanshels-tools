"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormField } from "@/components/forms/form-field";
import { UAE_RULES } from "@/lib/config/uaeRules";
import { readLeadIdentity } from "@/lib/lead-identity-storage";
import { leadCaptureSchema } from "@/lib/validators/lead";
import { trackEvent } from "@/lib/analytics/track";
import type { z } from "zod";

type FormValues = z.input<typeof leadCaptureSchema>;

type Props = {
  toolSlug: string;
  calculatorInputs: unknown;
  calculatorOutputs: unknown;
  assessmentSnapshot?: Record<string, unknown>;
  /** When set (e.g. from readiness check step 1), revenue band field is omitted and wired server-side from answers. */
  prefillAnnualRevenueBandId?: string;
};

export function LeadCaptureForm({
  toolSlug,
  calculatorInputs,
  calculatorOutputs,
  assessmentSnapshot,
  prefillAnnualRevenueBandId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revenuePrefilled =
    typeof prefillAnnualRevenueBandId === "string" && prefillAnnualRevenueBandId.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
      fullName: "",
      workEmail: "",
      phone: "",
      companyName: "",
      companySize: "",
      annualRevenueBand: "",
      primaryChallenge: "",
      consentAccepted: false,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = readLeadIdentity();
    form.reset({
      fullName: id?.fullName ?? "",
      workEmail: id?.workEmail ?? "",
      phone: "",
      companyName: id?.companyName ?? "",
      companySize: id?.companySize ?? "",
      annualRevenueBand: revenuePrefilled ? (prefillAnnualRevenueBandId as string) : "",
      primaryChallenge: "",
      consentAccepted: false,
    });
  }, [mounted, revenuePrefilled, prefillAnnualRevenueBandId, form]);

  const e = form.formState.errors;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    trackEvent("lead_capture_submitted", { toolSlug });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          annualRevenueBand: revenuePrefilled ? prefillAnnualRevenueBandId : values.annualRevenueBand,
          sourceToolSlug: toolSlug,
          calculatorInputs,
          calculatorOutputs,
          assessmentSnapshot,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }
      setDone(true);
    } catch {
      setError("Could not submit. Retry shortly or WhatsApp us from the footer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <Card className="print:hidden">
        <CardHeader>
          <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 max-w-lg animate-pulse rounded bg-muted/80" />
        </CardHeader>
        <div className="space-y-3 px-6 pb-6">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </Card>
    );
  }

  const identity = readLeadIdentity();
  const shortPath = identity !== null;

  if (done) {
    return (
      <Card className="border-primary/25 bg-gradient-to-br from-primary/8 to-card print:hidden">
        <CardHeader className="space-y-2">
          <CardTitle>Readout queued</CardTitle>
          <CardDescription>Urgent timelines? Reach us on WhatsApp with your company name.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/80 print:hidden">
      <CardHeader className="gap-1 border-b border-border/60 bg-muted/15 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Optional
        </p>
        <CardTitle>{shortPath ? "Email this plan" : "Email the detailed readout"}</CardTitle>
        <CardDescription className="leading-relaxed">
          {shortPath
            ? "Same details you already entered — confirm consent and we’ll route a written walkthrough."
            : "Structured walkthrough of your outputs plus consent."}
        </CardDescription>
      </CardHeader>
      <form
        className="space-y-5 px-6 py-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-busy={submitting}
      >
        {shortPath ? (
          <div className="space-y-4 rounded-xl border border-border/80 bg-background/80 px-4 py-3 text-sm shadow-sm">
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">{identity.fullName}</p>
              <p className="text-muted-foreground">{identity.workEmail}</p>
              <p className="text-muted-foreground">{identity.companyName}</p>
              <p className="text-xs text-muted-foreground">
                {companySizeHuman(identity.companySize)}
                {revenuePrefilled && prefillAnnualRevenueBandId ? (
                  <>
                    {" "}
                    ·{" "}
                    {UAE_RULES.revenueBandsAed.find((b) => b.id === prefillAnnualRevenueBandId)?.label ??
                      "Revenue from your check"}
                  </>
                ) : null}
              </p>
            </div>
            <input type="hidden" {...form.register("fullName")} />
            <input type="hidden" {...form.register("workEmail")} />
            <input type="hidden" {...form.register("companyName")} />
            <input type="hidden" {...form.register("companySize")} />
            {revenuePrefilled ? <input type="hidden" {...form.register("annualRevenueBand")} /> : null}
            {!revenuePrefilled ? (
              <div className="space-y-2 pt-2">
                <Label htmlFor="lead-annualRevenueBand-short">Annual revenue (AED band)</Label>
                <Select
                  onValueChange={(v) => {
                    if (typeof v !== "string") return;
                    form.setValue("annualRevenueBand", v, { shouldValidate: true });
                  }}
                  value={form.watch("annualRevenueBand") ?? undefined}
                >
                  <SelectTrigger id="lead-annualRevenueBand-short" aria-invalid={Boolean(e.annualRevenueBand)}>
                    <SelectValue placeholder="Choose revenue band" />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_RULES.revenueBandsAed.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {e.annualRevenueBand?.message ? (
                  <p role="alert" className="text-xs text-destructive">
                    {e.annualRevenueBand.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="lead-fullName" label="Full name" error={e.fullName?.message}>
              <Input autoComplete="name" {...form.register("fullName")} />
            </FormField>
            <FormField id="lead-workEmail" label="Work email" error={e.workEmail?.message}>
              <Input type="email" autoComplete="email" {...form.register("workEmail")} />
            </FormField>
            <FormField id="lead-phone" label="Phone (optional)" error={e.phone?.message}>
              <Input type="tel" autoComplete="tel" {...form.register("phone")} />
            </FormField>
            <FormField id="lead-companyName" label="Company name" error={e.companyName?.message}>
              <Input autoComplete="organization" {...form.register("companyName")} />
            </FormField>

            <div className="space-y-2">
              <Label htmlFor="lead-companySize">Company size</Label>
              <Select
                onValueChange={(v) => {
                  if (typeof v !== "string") return;
                  form.setValue("companySize", v, { shouldValidate: true });
                }}
                value={form.watch("companySize") ?? undefined}
              >
                <SelectTrigger id="lead-companySize" aria-invalid={Boolean(e.companySize)}>
                  <SelectValue placeholder="Select headcount band" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1–5 employees</SelectItem>
                  <SelectItem value="6-20">6–20 employees</SelectItem>
                  <SelectItem value="21-50">21–50 employees</SelectItem>
                  <SelectItem value="51-200">51–200 employees</SelectItem>
                  <SelectItem value="201-plus">201+ employees</SelectItem>
                </SelectContent>
              </Select>
              {e.companySize?.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {e.companySize.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-annualRevenueBand">Annual revenue (AED band)</Label>
              <Select
                onValueChange={(v) => {
                  if (typeof v !== "string") return;
                  form.setValue("annualRevenueBand", v, { shouldValidate: true });
                }}
                value={form.watch("annualRevenueBand") ?? undefined}
              >
                <SelectTrigger id="lead-annualRevenueBand" aria-invalid={Boolean(e.annualRevenueBand)}>
                  <SelectValue placeholder="Choose revenue band" />
                </SelectTrigger>
                <SelectContent>
                  {UAE_RULES.revenueBandsAed.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {e.annualRevenueBand?.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {e.annualRevenueBand.message}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <FormField id="lead-primaryChallenge" label="Primary challenge" error={e.primaryChallenge?.message}>
                <Textarea rows={3} {...form.register("primaryChallenge")} />
              </FormField>
            </div>
          </div>
        )}

        {shortPath ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="lead-phone-short" label="Phone (optional)" error={e.phone?.message}>
              <Input type="tel" autoComplete="tel" {...form.register("phone")} />
            </FormField>
            <div className="md:col-span-2">
              <FormField id="lead-primaryChallenge-short" label="Anything we should emphasise? (optional)" error={e.primaryChallenge?.message}>
                <Textarea rows={2} placeholder="e.g. Q1 filings, bank covenant review…" {...form.register("primaryChallenge")} />
              </FormField>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={form.watch("consentAccepted") ?? false}
              onCheckedChange={(v) => form.setValue("consentAccepted", Boolean(v), { shouldValidate: true })}
              id="lead-consent"
              aria-invalid={Boolean(e.consentAccepted)}
              aria-describedby="lead-consent-copy"
            />
            <label htmlFor="lead-consent" id="lead-consent-copy" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Consent</span> —{" "}
              {shortPath
                ? "The team may contact me about this readout. "
                : "I agree the team may contact me about this submission. "}
              Outputs are directional; confirm material decisions with your own advisors.
            </label>
          </div>
          {e.consentAccepted?.message ? (
            <p id="lead-consent-error" role="alert" className="mt-2 text-xs text-destructive">
              {String(e.consentAccepted.message)}
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <CardFooter className="flex flex-col gap-3 px-0 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : shortPath ? "Send readout" : "Send detailed report"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function companySizeHuman(v: string): string {
  const m: Record<string, string> = {
    "1-5": "1–5",
    "6-20": "6–20",
    "21-50": "21–50",
    "51-200": "51–200",
    "201-plus": "201+",
  };
  return m[v] ? `${m[v]} employees` : v;
}
