"use client";

import { useState } from "react";
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
import { leadCaptureSchema } from "@/lib/validators/lead";
import { trackEvent } from "@/lib/analytics/track";
import type { z } from "zod";

type FormValues = z.input<typeof leadCaptureSchema>;

export function LeadCaptureForm({
  toolSlug,
  calculatorInputs,
  calculatorOutputs,
  assessmentSnapshot,
}: {
  toolSlug: string;
  calculatorInputs: unknown;
  calculatorOutputs: unknown;
  assessmentSnapshot?: Record<string, unknown>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
      consentAccepted: false,
    },
  });

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
      setError("We could not submit right now. Retry in a moment or message us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>Request received</CardTitle>
          <CardDescription>
            Finanshels will route this to the right specialist. If this is urgent compliance timing, message the team on WhatsApp with
            your company name.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="print:hidden">
      <CardHeader className="gap-2">
        <CardTitle>Email the detailed readout</CardTitle>
        <CardDescription className="leading-relaxed">
          Get a structured walkthrough of your outputs and the next tools to run. Requires consent — no spam.
        </CardDescription>
      </CardHeader>
      <form
        className="space-y-6 px-6 pb-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        aria-busy={submitting}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="lead-fullName" label="Full name" error={e.fullName?.message}>
            <Input autoComplete="name" {...form.register("fullName")} />
          </FormField>
          <FormField id="lead-workEmail" label="Work email" error={e.workEmail?.message}>
            <Input type="email" autoComplete="email" {...form.register("workEmail")} />
          </FormField>
          <FormField id="lead-phone" label="Phone number" error={e.phone?.message}>
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
              <SelectTrigger
                id="lead-companySize"
                aria-invalid={Boolean(e.companySize)}
                aria-describedby={e.companySize ? "lead-companySize-error" : undefined}
              >
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
              <p id="lead-companySize-error" role="alert" className="text-xs text-destructive">
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
              <SelectTrigger
                id="lead-annualRevenueBand"
                aria-invalid={Boolean(e.annualRevenueBand)}
                aria-describedby={e.annualRevenueBand ? "lead-annualRevenueBand-error" : undefined}
              >
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
              <p id="lead-annualRevenueBand-error" role="alert" className="text-xs text-destructive">
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

        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={form.watch("consentAccepted") ?? false}
              onCheckedChange={(v) => form.setValue("consentAccepted", Boolean(v), { shouldValidate: true })}
              id="lead-consent"
              aria-invalid={Boolean(e.consentAccepted)}
              aria-describedby="lead-consent-copy"
            />
            <label htmlFor="lead-consent" id="lead-consent-copy" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Consent &amp; privacy</span> — I agree Finanshels may contact me about this
              submission. I understand outputs are directional and must be validated with qualified advisors before decisions.
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
            {submitting ? "Submitting…" : "Send detailed report"}
          </Button>
          {submitting ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Sending securely…
            </p>
          ) : null}
        </CardFooter>
      </form>
    </Card>
  );
}
