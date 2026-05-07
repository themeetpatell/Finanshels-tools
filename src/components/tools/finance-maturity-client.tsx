"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { DimensionBarChart } from "@/components/results/dimension-bar-chart";
import { NextTools } from "@/components/results/next-tools";
import { PrintReport } from "@/components/results/print-report";
import { ReportPrintHeader } from "@/components/results/report-print-header";
import { ScoreHighlight } from "@/components/results/score-highlight";
import { StepProgressSection } from "@/components/tools/step-progress-section";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { CtaRow } from "@/components/tools/cta-row";

import { computeFinanceMaturity } from "@/lib/scoring/finance-maturity";
import type { FinanceMaturityAnswers } from "@/lib/scoring/finance-maturity";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { trackEvent } from "@/lib/analytics/track";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const optionSchema = z.coerce.number().int().min(0).max(3);

const formSchema = z.object({
  compliancePosture: optionSchema,
  vatGovernance: optionSchema,
  ctReadinessArtifacts: optionSchema,
  cashForecastHorizonWeeks: optionSchema,
  debtorControl: optionSchema,
  apDiscipline: optionSchema,
  monthEndCloseCadence: optionSchema,
  policyControlEnvironment: optionSchema,
  managementReportingQuality: optionSchema,
  boardInvestorReporting: optionSchema,
  teamStructureCoverage: optionSchema,
});

type MaturityFormValues = z.infer<typeof formSchema>;

const LEVELS = [
  { id: "0", label: "Ad hoc / missing" },
  { id: "1", label: "Basic / inconsistent" },
  { id: "2", label: "Defined / repeatable" },
  { id: "3", label: "Strong / investor-grade signal" },
] as const;

const TOOL_SLUG = "finance-maturity-score";

export function FinanceMaturityClient() {
  const token = useAnonymousToken();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<MaturityFormValues>({
    resolver: zodResolver(formSchema) as Resolver<MaturityFormValues>,
    defaultValues: {
      compliancePosture: 2,
      vatGovernance: 2,
      ctReadinessArtifacts: 1,
      cashForecastHorizonWeeks: 1,
      debtorControl: 2,
      apDiscipline: 2,
      monthEndCloseCadence: 2,
      policyControlEnvironment: 1,
      managementReportingQuality: 1,
      boardInvestorReporting: 1,
      teamStructureCoverage: 2,
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG });
  }, []);

  const result = submitted ? computeFinanceMaturity(form.getValues() as FinanceMaturityAnswers) : null;

  async function finalize(nextValues: MaturityFormValues) {
    const computed = computeFinanceMaturity(nextValues as FinanceMaturityAnswers);
    trackEvent("tool_completed", { toolSlug: TOOL_SLUG, overallScore: computed.overall });
    setSubmitted(true);

    fetch("/api/tool-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolSlug: TOOL_SLUG,
        anonymousToken: token ?? undefined,
        inputs: nextValues as FinanceMaturityAnswers,
        outputs: computed,
      }),
    }).catch(() => undefined);
  }

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <ToolPageHeader slug={TOOL_SLUG} />

      <StepProgressSection
        labelId="finance-maturity-progress"
        label="Guided maturity pass"
        stepIndex={step}
        stepCount={3}
        submitted={submitted}
      />

      {!submitted ? (
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(async (vals) => {
            if (step < 2) {
              setStep((s) => ((s + 1) as 0 | 1 | 2));
              return;
            }
            await finalize(vals);
          })}
        >
          {step === 0 && (
            <Card>
              <CardHeader className="gap-2 pb-4">
                <CardTitle className="text-lg">Compliance & governance</CardTitle>
                <CardDescription>Judge where you realistically sit today.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <LikertSelect form={form} name="compliancePosture" label="Corporate governance & filings discipline" />
                <LikertSelect form={form} name="vatGovernance" label="VAT evidence trails & reconciliation ownership" />
                <LikertSelect form={form} name="ctReadinessArtifacts" label="Corporate tax readiness artefacts & timelines" />
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader className="gap-2 pb-4">
                <CardTitle className="text-lg">Cash & working capital</CardTitle>
                <CardDescription>Collections & payables behaviour in AED realities.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <LikertSelect form={form} name="cashForecastHorizonWeeks" label="Rolling cash forecast horizon" />
                <LikertSelect form={form} name="debtorControl" label="Debtor discipline & aging hygiene" />
                <LikertSelect form={form} name="apDiscipline" label="Payables approvals & disbursements" />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="gap-2 pb-4">
                <CardTitle className="text-lg">Finance ops & reporting maturity</CardTitle>
                <CardDescription>Close quality, reporting usefulness, staffing fit.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <LikertSelect form={form} name="monthEndCloseCadence" label="Month-end close predictability" />
                <LikertSelect form={form} name="policyControlEnvironment" label="Policies & controls baseline" />
                <LikertSelect form={form} name="managementReportingQuality" label="Monthly management reporting usefulness" />
                <LikertSelect form={form} name="boardInvestorReporting" label="Investor/board reporting readiness" />
                <LikertSelect form={form} name="teamStructureCoverage" label="Finance team structure vs workload" />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => ((Math.max(s - 1, 0) as 0 | 1 | 2)))}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="lg">
              {step < 2 ? "Continue" : "Calculate maturity score"}
            </Button>
          </div>

          <DisclaimerCard body="Finance maturity scoring is directional. UAE mainland vs free-zone facts materially change interpretations." />
        </form>
      ) : (
        <Card className="border-primary/20 bg-gradient-to-br from-card via-background to-background">
          <CardHeader className="gap-4">
            <ScoreHighlight value={result?.overall ?? 0} label="Overall maturity score" sublabel={result?.bandLabel} />
            <CardDescription className="text-base leading-relaxed text-muted-foreground">{result?.bandDescription}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <DimensionBarChart
              title="Capability dimensions (0–100)"
              data={[
                { label: "Compliance", value: result?.dimensions.compliance ?? 0 },
                { label: "Cashflow", value: result?.dimensions.cashflow ?? 0 },
                { label: "Finance Ops", value: result?.dimensions.financeOps ?? 0 },
                { label: "Reporting", value: result?.dimensions.reporting ?? 0 },
                { label: "Team", value: result?.dimensions.teamStructure ?? 0 },
              ]}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Top risks</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {result?.topRisks.map((r) => (
                    <li key={r.dimension}>
                      <span className="font-medium text-foreground">{r.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Priorities next 90 days</h3>
                <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                  {result?.topPriorities.map((p, idx) => (
                    <li key={idx}>{p.title}</li>
                  ))}
                </ol>
              </div>
            </div>

            <CtaRow
              prominent
              toolSlug={TOOL_SLUG}
              whatsappMessage="Hi Finanshels — I completed the Finance Maturity Score and want clarity on priorities."
            />

            <PrintReport>
              <div className="space-y-4">
                <ReportPrintHeader
                  tool="Finance Maturity Score"
                  subtitle={`Overall ${result?.overall} • ${result?.bandLabel}`}
                />
                <ul className="text-sm text-muted-foreground">
                  <li>Compliance: {result?.dimensions.compliance}</li>
                  <li>Cashflow: {result?.dimensions.cashflow}</li>
                  <li>Finance ops: {result?.dimensions.financeOps}</li>
                  <li>Reporting: {result?.dimensions.reporting}</li>
                  <li>Team structure: {result?.dimensions.teamStructure}</li>
                </ul>
                <Separator />
                <p className="text-sm">{result?.bandDescription}</p>
              </div>
            </PrintReport>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
              <NextTools tools={getNextRecommendedTools("finance-maturity-score")} />
            </div>

            <LeadCaptureForm
              toolSlug={TOOL_SLUG}
              calculatorInputs={form.getValues() as FinanceMaturityAnswers}
              calculatorOutputs={result ?? {}}
            />

            <DisclaimerCard body="Outputs align priorities — they do not certify compliance readiness or replace external advisers." />
          </CardContent>
        </Card>
      )}

      <StickyMobileCta
        toolSlug={TOOL_SLUG}
        whatsappMessage="Hi Finanshels — I am using Finance Navigator and want help interpreting results."
      />
    </div>
  );
}

function LikertSelect({
  form,
  name,
  label,
}: {
  form: UseFormReturn<MaturityFormValues>;
  name: keyof MaturityFormValues;
  label: string;
}) {
  const value = String(form.watch(name));
  const err = form.formState.errors[name]?.message;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => form.setValue(name, Number(v) as 0 | 1 | 2 | 3, { shouldValidate: true })}
      >
        <SelectTrigger aria-invalid={!!err}>
          <SelectValue placeholder="Pick maturity level" />
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {typeof err === "string" ? <p className="text-xs text-destructive">{err}</p> : null}
    </div>
  );
}

