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
import { readLeadIdentity } from "@/lib/lead-identity-storage";
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
      const profile = readLeadIdentity();
      await persistAssessmentPayload({
        answers: mapped,
        outcome: routed,
        identifiedLead: profile
          ? { fullName: profile.fullName, workEmail: profile.workEmail, companyName: profile.companyName }
          : undefined,
      });
    } finally {
      setRouting(false);
    }
  }

  const firstErr = getFirstErrorMessage(form.formState.errors);

  return (
    <div className="space-y-10 pb-24 md:pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-navy-900/[0.07] bg-gradient-to-br from-white via-card to-orange-light/[0.45] px-4 py-8 shadow-[0_24px_60px_-36px_rgba(8,32,50,0.45)] ring-1 ring-black/[0.04] sm:px-6 sm:py-10 md:px-11 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-10 h-56 w-56 rounded-full bg-navy-900/10 blur-3xl"
        />
        <div className="relative space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Finance Navigator · UAE</p>
          <h1 className="text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground min-[400px]:text-3xl md:text-[2.35rem]">
            UAE finance readiness check
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Three short steps (~2 minutes). We map mainland vs free zone, filings posture, and what matters now — then suggest which free calculators to open
            first.
          </p>
        </div>
      </header>

      <StepProgressSection
        labelId="assessment-progress"
        label="Progress"
        stepIndex={step}
        stepCount={3}
        submitted={finished}
      />

      {!finished ? (
        <form
          className="space-y-8"
          onSubmit={form.handleSubmit(async () => {
            if (step < 2) {
              setStep((s) => ((s + 1) as 0 | 1 | 2));
              return;
            }
            await onFinish();
          })}
        >
          {step === 0 && (
            <Card className="overflow-visible rounded-2xl border-navy-900/[0.06] shadow-[0_22px_50px_-32px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.03]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Business profile</CardTitle>
                <CardDescription>Tells us how you operate so suggestions stay relevant.</CardDescription>
              </CardHeader>
              <CardContent className="grid min-w-0 gap-6 md:grid-cols-2 md:gap-8">
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
                <Field label="Annual revenue (AED band)">
                  <Select
                    value={form.watch("annualRevenueBandId")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("annualRevenueBandId", v, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose band">
                        {(val: unknown) =>
                          UAE_RULES.revenueBandsAed.find((b) => b.id === val)?.label ?? "Choose band"}
                      </SelectValue>
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
            <Card className="overflow-visible rounded-2xl border-navy-900/[0.06] shadow-[0_22px_50px_-32px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.03]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Finance stack & filings</CardTitle>
                <CardDescription>Approximate answers are fine — we’re sizing guidance, not auditing you.</CardDescription>
              </CardHeader>
              <CardContent className="grid min-w-0 gap-6 md:grid-cols-2 md:gap-8">
                <Field label="VAT registration">
                  <Select
                    value={form.watch("vatRegistered")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("vatRegistered", v as UiFormValues["vatRegistered"], { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose one">
                        {(val: unknown) =>
                          val === "yes" ? "Yes, registered" : val === "no" ? "Not registered / doesn’t apply yet" : "Choose one"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, registered</SelectItem>
                      <SelectItem value="no">Not registered / doesn’t apply yet</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Corporate tax (Federal Decree‑Law regime)">
                  <Select
                    value={form.watch("ctStatus")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("ctStatus", v as UiFormValues["ctStatus"], { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose one">
                        {(val: unknown) => {
                          const m: Record<string, string> = {
                            registered: "Registered with the FTA",
                            in_progress: "In progress with advisors or internal team",
                            no: "Not started yet",
                            unknown: "Not sure — needs clarity",
                          };
                          return (typeof val === "string" && m[val]) || "Choose one";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered with the FTA</SelectItem>
                      <SelectItem value="in_progress">In progress with advisors or internal team</SelectItem>
                      <SelectItem value="no">Not started yet</SelectItem>
                      <SelectItem value="unknown">Not sure — needs clarity</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <SelectField label="Books & tools" value={form.watch("accountingSoftwareStatus")} onChange={(v) =>
                  form.setValue("accountingSoftwareStatus", v as UiFormValues["accountingSoftwareStatus"], { shouldValidate: true })}
                  options={[
                    { value: "none", label: "Mostly spreadsheets" },
                    { value: "basic", label: "Cloud accounting (basic use)" },
                    { value: "erp_light", label: "Stack in place; processes still uneven" },
                    { value: "erp_mature", label: "Mature system & controls discipline" },
                  ]}
                />

                <SelectField label="Rough monthly invoice volume" value={form.watch("monthlyInvoiceVolume")} onChange={(v) =>
                  form.setValue("monthlyInvoiceVolume", v as UiFormValues["monthlyInvoiceVolume"], { shouldValidate: true })}
                  options={[
                    { value: "under_50", label: "Fewer than 50" },
                    { value: "50_250", label: "50 to 250" },
                    { value: "250_1500", label: "250 to 1,500" },
                    { value: "1500_plus", label: "Over 1,500" },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="overflow-visible rounded-2xl border-navy-900/[0.06] shadow-[0_22px_50px_-32px_rgba(8,32,50,0.35)] ring-1 ring-black/[0.03]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Priorities</CardTitle>
                <CardDescription>Pick what worries you most and how soon you want to act.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="min-w-0 space-y-3">
                  <Label className="text-base font-medium">Top concern</Label>
                  <RadioGroup
                    value={form.watch("biggestConcern")}
                    onValueChange={(v) => {
                      if (typeof v !== "string") return;
                      form.setValue("biggestConcern", v as AssessmentAnswers["biggestConcern"], { shouldValidate: true });
                    }}
                  >
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <RadioChoice value="cashflow_pressure" label="Cash and runway pressure" />
                      <RadioChoice value="compliance_deadlines" label="VAT, corporate tax & filing deadlines" />
                      <RadioChoice value="financial_visibility" label="Real profitability & management reporting" />
                      <RadioChoice value="pricing_margins" label="Margins, pricing & cost control" />
                      <RadioChoice value="hiring_structure" label="Building or outsourcing the finance team" />
                      <RadioChoice value="scaling_controls" label="Governance as the company scales" />
                    </div>
                  </RadioGroup>
                </div>

                <SelectField label="Who runs finance today?" value={form.watch("financeTeamSetup")} onChange={(v) =>
                  form.setValue("financeTeamSetup", v as UiFormValues["financeTeamSetup"], { shouldValidate: true })}
                  options={[
                    { value: "founder_led", label: "Founder / operator-led" },
                    { value: "single_accountant", label: "One finance person" },
                    { value: "small_team", label: "Small in-house team (2–4)" },
                    { value: "controller_grade", label: "Controller-level internal team" },
                    { value: "fractional_external", label: "Outsourced + fractional leadership" },
                  ]}
                />

                <SelectField label="How soon do you want help?" value={form.watch("urgency")} onChange={(v) => form.setValue("urgency", v as UiFormValues["urgency"], { shouldValidate: true })}
                  options={[
                    { value: "this_month", label: "This month" },
                    { value: "quarter", label: "This quarter" },
                    { value: "six_month_window", label: "Next ~6 months" },
                    { value: "exploring", label: "Just exploring options" },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 border-navy-900/15 bg-white/80"
                disabled={routing}
                onClick={() => setStep((s) => ((Math.max(s - 1, 0) as 0 | 1 | 2)))}
              >
                Back
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <Button size="lg" type="submit" disabled={routing} className="min-h-12 min-w-[200px] shadow-md shadow-primary/20 sm:ml-auto">
              {routing ? "Saving…" : step < 2 ? "Continue" : "See suggested calculators"}
            </Button>
          </div>

          <DisclaimerCard compact body="Suggested order is heuristic — groups with complex structuring should confirm with advisors." />

          {firstErr ? (
            <p role="alert" className="text-sm text-destructive">
              {firstErr}
            </p>
          ) : null}
        </form>
      ) : outcome && answers ? (
        <div className="space-y-10">
            <Card className="rounded-2xl border-primary/25 bg-gradient-to-br from-card via-orange-light/20 to-background shadow-[0_20px_48px_-30px_rgba(241,102,17,0.35)] ring-1 ring-primary/10">
            <CardHeader className="space-y-4">
              <CardTitle className="text-2xl">Suggested focus: {TRACK_LABELS[outcome.recommendedTrack as TrackId].title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">{TRACK_LABELS[outcome.recommendedTrack as TrackId].subtitle}</CardDescription>
              <Separator />
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.maturitySnapshot}</p>
              <Separator />
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.why}</p>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-navy-900/[0.06] shadow-[0_18px_44px_-28px_rgba(8,32,50,0.3)] ring-1 ring-black/[0.03]">
            <CardHeader>
              <CardTitle className="text-xl">Your suggested order</CardTitle>
              <CardDescription>Try these calculators first — each one sets context for the next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-none space-y-5">
                {outcome.topTools.map((slug, idx) => (
                  <li key={slug} className="flex gap-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold tabular-nums text-primary-foreground shadow-sm shadow-primary/20"
                      aria-hidden
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-semibold leading-snug md:text-base">{TOOLS_BY_SLUG[slug].title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{TOOLS_BY_SLUG[slug].purpose}</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tools/${slug}`}>Launch tool</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href={`/tools/${outcome.topTools[0]}`}>Start with the first calculator</Link>
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
            prefillAnnualRevenueBandId={answers.annualRevenueBandId}
            assessmentSnapshot={{
              routedTrack: outcome.recommendedTrack,
              topTools: outcome.topTools,
            }}
          />

          <DisclaimerCard compact body="Results are for planning conversations only — engagement terms are confirmed separately with Finanshels." />

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
    <div className="min-w-0 space-y-2">
      <Label className="text-sm font-medium leading-snug">{label}</Label>
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
  const lookup = Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<string, string>;
  return (
    <Field label={label}>
      <Select
        value={value}
        onValueChange={(v) => {
          if (typeof v !== "string") return;
          onChange(v);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose one">
            {(val: unknown) => (typeof val === "string" && lookup[val] ? lookup[val] : "Choose one")}
          </SelectValue>
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
    <label
      htmlFor={`concern-${value}`}
      className="flex min-h-[3rem] cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card/80 px-3 py-3 text-left shadow-sm transition hover:border-primary/30 hover:bg-accent/40"
    >
      <RadioGroupItem value={value} id={`concern-${value}`} className="mt-1" />
      <span className="text-sm leading-snug">{label}</span>
    </label>
  );
}
