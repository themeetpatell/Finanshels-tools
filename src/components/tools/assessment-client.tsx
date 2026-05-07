"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StepProgressSection } from "@/components/tools/step-progress-section";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { TRACK_LABELS, type TrackId } from "@/lib/tools/tracks";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { UAE_RULES } from "@/lib/config/uaeRules";
import { routeAssessment } from "@/lib/scoring/assessment-router";
import type { AssessmentAnswers } from "@/lib/scoring/assessment-router";
import { trackEvent } from "@/lib/analytics/track";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const uiSchema = z.object({
  businessType: z.enum(["services", "product", "trading_distribution", "holding_group", "other"]),
  location: z.enum(["mainland", "free_zone"]),
  companyAgeMonths: z.coerce.number().min(1).max(600),
  annualRevenueBandId: z.string().min(1),
  employeeCount: z.coerce.number().min(1).max(50_000),
  monthlyInvoiceVolume: z.enum(["under_50", "50_250", "250_1500", "1500_plus"]),
  biggestConcern: z.enum([
    "cashflow_pressure",
    "compliance_deadlines",
    "financial_visibility",
    "pricing_margins",
    "hiring_structure",
    "scaling_controls",
  ]),
  financeTeamSetup: z.enum(["founder_led", "single_accountant", "small_team", "controller_grade", "fractional_external"]),
  urgency: z.enum(["this_month", "quarter", "six_month_window", "exploring"]),
  vatRegistered: z.enum(["yes", "no"]),
  ctStatus: z.enum(["registered", "in_progress", "no", "unknown"]),
  accountingSoftwareStatus: z.enum(["none", "basic", "erp_light", "erp_mature"]),
});

export type UiFormValues = z.infer<typeof uiSchema>;

export function AssessmentClient() {
  const token = useAnonymousToken();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [finished, setFinished] = useState(false);
  const [routing, setRouting] = useState(false);

  const form = useForm<UiFormValues>({
    resolver: zodResolver(uiSchema) as Resolver<UiFormValues>,
    defaultValues: {
      businessType: "services",
      location: "mainland",
      companyAgeMonths: 36,
      annualRevenueBandId: "2m_10m",
      employeeCount: 45,
      vatRegistered: "yes",
      ctStatus: "in_progress",
      accountingSoftwareStatus: "erp_light",
      monthlyInvoiceVolume: "250_1500",
      biggestConcern: "financial_visibility",
      financeTeamSetup: "small_team",
      urgency: "quarter",
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("assessment_started", {});
  }, []);

  const answers: AssessmentAnswers | null = finished ? mapUiToAssessment(form.getValues()) : null;

  const outcome = answers ? routeAssessment(answers) : null;

  async function persistAssessmentPayload(payload: Record<string, unknown>) {
    await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousToken: token ?? undefined,
        assessmentPayload: payload,
      }),
    }).catch(() => undefined);
  }

  async function onFinish() {
    setRouting(true);
    try {
      const vals = form.getValues();
      const mapped = mapUiToAssessment(vals);
      const routed = routeAssessment(mapped);
      trackEvent("assessment_completed", { recommendedTrack: routed.recommendedTrack });
      setFinished(true);
      await persistAssessmentPayload({
        answers: mapped,
        outcome: routed,
      });
    } finally {
      setRouting(false);
    }
  }

  const firstErr = getFirstErrorMessage(form.formState.errors);

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <header className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Finance Navigator Assessment</h1>
        <p className="max-w-3xl text-pretty text-muted-foreground leading-relaxed">
          Short routing pass that sequences tools for UAE finance leaders — deterministic next steps rather than noisy advice.
        </p>
      </header>

      <StepProgressSection
        labelId="assessment-progress"
        label="Navigator routing"
        stepIndex={step}
        stepCount={3}
        submitted={finished}
      />

      {!finished ? (
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(async () => {
            if (step < 2) {
              setStep((s) => ((s + 1) as 0 | 1 | 2));
              return;
            }
            await onFinish();
          })}
        >
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business profile</CardTitle>
                <CardDescription>Factors that materially change sequencing risk.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <SelectField label="Business type" value={form.watch("businessType")} onChange={(v) => form.setValue("businessType", v as UiFormValues["businessType"], { shouldValidate: true })}
                  options={[
                    { value: "services", label: "Services / agency" },
                    { value: "product", label: "Product / tech" },
                    { value: "trading_distribution", label: "Trading / distribution" },
                    { value: "holding_group", label: "Holding / multi-entity" },
                    { value: "other", label: "Other" },
                  ]}
                />

                <SelectField label="Base of operations" value={form.watch("location")} onChange={(v) => form.setValue("location", v as UiFormValues["location"], { shouldValidate: true })}
                  options={[
                    { value: "mainland", label: "Mainland UAE" },
                    { value: "free_zone", label: "Free zone UAE" },
                  ]}
                />

                <Field label="Company age (months)">
                  <Input type="number" {...form.register("companyAgeMonths")} />
                </Field>
                <Field label="Annual revenue band (AED)">
                  <Select
                    value={form.watch("annualRevenueBandId")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("annualRevenueBandId", v, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UAE_RULES.revenueBandsAed.map((band) => (
                        <SelectItem key={band.id} value={band.id}>
                          {band.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Employees (approximate headcount)">
                  <Input type="number" {...form.register("employeeCount")} />
                </Field>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance posture & operating load</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="VAT registered?">
                  <Select
                    value={form.watch("vatRegistered")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("vatRegistered", v as UiFormValues["vatRegistered"], { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No / not relevant yet</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Corporate tax registration posture">
                  <Select
                    value={form.watch("ctStatus")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("ctStatus", v as UiFormValues["ctStatus"], { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered / underway confidently</SelectItem>
                      <SelectItem value="in_progress">Structured work with advisers</SelectItem>
                      <SelectItem value="no">Not started</SelectItem>
                      <SelectItem value="unknown">Unknown internally</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <SelectField label="Accounting / ERP posture" value={form.watch("accountingSoftwareStatus")} onChange={(v) =>
                  form.setValue("accountingSoftwareStatus", v as UiFormValues["accountingSoftwareStatus"], { shouldValidate: true })}
                  options={[
                    { value: "none", label: "Spreadsheet-first" },
                    { value: "basic", label: "Light cloud accounting" },
                    { value: "erp_light", label: "Defined stack, uneven governance" },
                    { value: "erp_mature", label: "Mature ERP & controls-aware" },
                  ]}
                />

                <SelectField label="Monthly invoice throughput" value={form.watch("monthlyInvoiceVolume")} onChange={(v) =>
                  form.setValue("monthlyInvoiceVolume", v as UiFormValues["monthlyInvoiceVolume"], { shouldValidate: true })}
                  options={[
                    { value: "under_50", label: "Under 50 invoices" },
                    { value: "50_250", label: "50 – 250 invoices" },
                    { value: "250_1500", label: "250 – 1500 invoices" },
                    { value: "1500_plus", label: "1500+ invoices" },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pressure points & pacing</CardTitle>
                <CardDescription>Concern + urgency dictates how aggressively we stack tools.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="space-y-2">
                  <Label>Biggest concern right now</Label>
                  <RadioGroup
                    value={form.watch("biggestConcern")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("biggestConcern", v as AssessmentAnswers["biggestConcern"], { shouldValidate: true });
                    }}
                  >
                    <div className="grid gap-2 md:grid-cols-2">
                      <RadioChoice value="cashflow_pressure" label="Liquidity timing & AED runway stress" />
                      <RadioChoice value="compliance_deadlines" label="Filings, penalties, registrations" />
                      <RadioChoice value="financial_visibility" label="Seeing true profitability & KPI signal" />
                      <RadioChoice value="pricing_margins" label="Margins / pricing / unit economics drift" />
                      <RadioChoice value="hiring_structure" label="Finance hiring vs outsourced model decisions" />
                      <RadioChoice value="scaling_controls" label="Controls, governance & finance scaling" />
                    </div>
                  </RadioGroup>
                </div>

                <SelectField label="Finance team setup today" value={form.watch("financeTeamSetup")} onChange={(v) =>
                  form.setValue("financeTeamSetup", v as UiFormValues["financeTeamSetup"], { shouldValidate: true })}
                  options={[
                    { value: "founder_led", label: "Founder / operator bookkeeping" },
                    { value: "single_accountant", label: "Single finance owner" },
                    { value: "small_team", label: "2–4 hybrid finance teammates" },
                    { value: "controller_grade", label: "Controller-grade internal squad" },
                    { value: "fractional_external", label: "Outsourced + fractional CFO" },
                  ]}
                />

                <SelectField label="Urgency window" value={form.watch("urgency")} onChange={(v) => form.setValue("urgency", v as UiFormValues["urgency"], { shouldValidate: true })}
                  options={[
                    { value: "this_month", label: "This month — remediation mode" },
                    { value: "quarter", label: "This quarter — disciplined execution window" },
                    { value: "six_month_window", label: "~6 months — roadmap investment" },
                    { value: "exploring", label: "Benchmarking — no imminent crisis" },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" disabled={routing} onClick={() => setStep((s) => ((Math.max(s - 1, 0) as 0 | 1 | 2)))}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button size="lg" type="submit" disabled={routing}>
              {routing ? "Routing…" : step < 2 ? "Continue" : "Generate Navigator sequence"}
            </Button>
          </div>

          <DisclaimerCard body="Routing heuristics are tuned for SMEs – large groups need bespoke structuring reviews." />

          {firstErr ? (
            <p role="alert" className="text-sm text-destructive">
              {firstErr}
            </p>
          ) : null}
        </form>
      ) : outcome && answers ? (
        <div className="space-y-10">
          <Card className="border-primary/30 bg-gradient-to-br from-card via-background to-background">
            <CardHeader className="space-y-4">
              <CardTitle className="text-2xl">Recommended track — {TRACK_LABELS[outcome.recommendedTrack as TrackId].title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">{TRACK_LABELS[outcome.recommendedTrack as TrackId].subtitle}</CardDescription>
              <Separator />
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.maturitySnapshot}</p>
              <Separator />
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.why}</p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Sequenced toolkit</CardTitle>
              <CardDescription>Continue in order — each pass sharpens subsequent inputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-4 ps-5">
                {outcome.topTools.map((slug, idx) => (
                  <li key={slug} className="space-y-1">
                    <p className="text-sm font-semibold">
                      {idx + 1}. {TOOLS_BY_SLUG[slug].title}
                    </p>
                    <p className="text-sm text-muted-foreground">{TOOLS_BY_SLUG[slug].purpose}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tools/${slug}`}>Launch tool</Link>
                    </Button>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={`/tools/${outcome.topTools[0]}`}>Continue into tool #1</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/tools">Browse toolkit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <LeadCaptureForm
            toolSlug="finance-navigator-assessment"
            calculatorInputs={answers}
            calculatorOutputs={outcome}
            assessmentSnapshot={{
              routedTrack: outcome.recommendedTrack,
              topTools: outcome.topTools,
            }}
          />

          <DisclaimerCard body="Assessment does not constitute onboarding — scope is confirmed commercially with Finanshels." />

          <StickyMobileCta
            toolSlug="finance-navigator-assessment"
            whatsappMessage="Hi Finanshels — I completed the Finance Navigator assessment and want to discuss the recommended sequence."
          />
        </div>
      ) : null}
    </div>
  );
}

function mapUiToAssessment(ui: UiFormValues): AssessmentAnswers {
  let ctRegisteredKnown: AssessmentAnswers["ctRegisteredKnown"] = null;
  if (ui.ctStatus === "registered") ctRegisteredKnown = true;
  if (ui.ctStatus === "no") ctRegisteredKnown = false;

  return {
    businessType: ui.businessType,
    location: ui.location,
    companyAgeMonths: ui.companyAgeMonths,
    annualRevenueBandId: ui.annualRevenueBandId,
    employeeCount: ui.employeeCount,
    vatRegistered: ui.vatRegistered === "yes",
    ctRegisteredKnown,
    accountingSoftwareStatus: ui.accountingSoftwareStatus,
    monthlyInvoiceVolume: ui.monthlyInvoiceVolume,
    biggestConcern: ui.biggestConcern,
    financeTeamSetup: ui.financeTeamSetup,
    urgency: ui.urgency,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <Select
        value={value}
        onValueChange={(v) => {
          if (typeof v !== "string") return;
          onChange(v);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function RadioChoice({ value, label }: { value: AssessmentAnswers["biggestConcern"]; label: string }) {
  return (
    <label htmlFor={`concern-${value}`} className="flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 hover:bg-accent/60">
      <RadioGroupItem value={value} id={`concern-${value}`} />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
}
