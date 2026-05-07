"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ScoreHighlight } from "@/components/results/score-highlight";
import { LabeledSlot } from "@/components/forms/labeled-slot";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { CtaRow } from "@/components/tools/cta-row";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { WorkflowStatusLine } from "@/components/tools/workflow-status-line";

import { computeCashflowHealth, type CashflowHealthInputs } from "@/lib/scoring/cashflow-health";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { formatAed } from "@/lib/format/currency";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { toolFunnelContext } from "@/lib/tools/canonical-sequence";
import { toolSessionRequestBody } from "@/lib/tools/tool-session-request";
import { trackEvent } from "@/lib/analytics/track";
import { markToolCompleted } from "@/lib/toolkit-progress";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const schema = z.object({
  monthlyInflowAed: z.coerce.number().min(0).max(1_500_000_000),
  monthlyOutflowAed: z.coerce.number().min(0).max(1_500_000_000),
  receivablesOutstandingAed: z.coerce.number().min(0).max(2_000_000_000),
  averageCollectionDays: z.coerce.number().min(0).max(270),
  delayedCustomersCount: z.coerce.number().min(0).max(500),
  reserveBufferMonths: z.coerce.number().min(0).max(240),
  fixedMonthlyObligationsAed: z.coerce.number().min(0).max(1_000_000_000),
  customerConcentration: z.enum(["healthy", "moderate", "high"]),
  runwayPressure: z.enum(["stable", "tight_3_to_6m", "critical_under_3m", "growth_strained"]),
});

const TOOL_SLUG = "cashflow-health-checkup";
const funnel = toolFunnelContext(TOOL_SLUG);

export function CashflowHealthClient() {
  const token = useAnonymousToken();
  const [submitted, setSubmitted] = useState(false);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      monthlyInflowAed: 520_000,
      monthlyOutflowAed: 505_000,
      receivablesOutstandingAed: 380_000,
      averageCollectionDays: 68,
      delayedCustomersCount: 4,
      reserveBufferMonths: 4,
      fixedMonthlyObligationsAed: 220_000,
      customerConcentration: "moderate",
      runwayPressure: "tight_3_to_6m",
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG, ...funnel });
  }, []);

  const result = submitted ? computeCashflowHealth(form.getValues() as CashflowHealthInputs) : null;

  async function onSubmit(vals: z.infer<typeof schema>) {
    const computed = computeCashflowHealth(vals as CashflowHealthInputs);
    trackEvent("tool_completed", { toolSlug: TOOL_SLUG, cashflowScore: computed.cashflowScore, ...funnel });
    markToolCompleted(TOOL_SLUG);
    setSubmitted(true);
    fetch("/api/tool-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toolSessionRequestBody(TOOL_SLUG, token, vals, computed)),
    }).catch(() => undefined);
  }

  const firstErr = getFirstErrorMessage(form.formState.errors);

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <ToolPageHeader slug={TOOL_SLUG} />

      <WorkflowStatusLine
        phase={submitted ? "results" : "inputs"}
        detail="Map collections, runway, concentration, and fixed obligations — all figures can be management estimates in AED."
      />

      {!submitted ? (
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cash posture inputs</CardTitle>
              <CardDescription>Use management estimates — directional output beats false precision.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <LabeledSlot label="Average monthly collections / inflows (AED)">
                <Input type="number" inputMode="decimal" {...form.register("monthlyInflowAed")} />
              </LabeledSlot>
              <LabeledSlot label="Average monthly disbursements (AED)">
                <Input type="number" inputMode="decimal" {...form.register("monthlyOutflowAed")} />
              </LabeledSlot>
              <LabeledSlot label="Outstanding receivables balance (AED)">
                <Input type="number" inputMode="decimal" {...form.register("receivablesOutstandingAed")} />
              </LabeledSlot>
              <LabeledSlot label="Average debtor collection cycle (days)">
                <Input type="number" inputMode="decimal" {...form.register("averageCollectionDays")} />
              </LabeledSlot>
              <LabeledSlot label="Number of customers chronically delaying payment">
                <Input type="number" inputMode="decimal" {...form.register("delayedCustomersCount")} />
              </LabeledSlot>
              <LabeledSlot label="Reserve runway (months of cover as you define it internally)">
                <Input type="number" inputMode="decimal" {...form.register("reserveBufferMonths")} />
              </LabeledSlot>
              <LabeledSlot label="Fixed non-negotiable monthly obligations — rent/payroll floor (AED)">
                <Input type="number" inputMode="decimal" {...form.register("fixedMonthlyObligationsAed")} />
              </LabeledSlot>
              <LabeledSlot label="Customer concentration">
                <Select
                  value={form.watch("customerConcentration")}
                  onValueChange={(v) =>
                    form.setValue("customerConcentration", v as CashflowHealthInputs["customerConcentration"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy — diversified</SelectItem>
                    <SelectItem value="moderate">Moderate — watchlist</SelectItem>
                    <SelectItem value="high">High concentration</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
              <LabeledSlot label="Cash runway pressure sentiment">
                <Select
                  value={form.watch("runwayPressure")}
                  onValueChange={(v) =>
                    form.setValue("runwayPressure", v as CashflowHealthInputs["runwayPressure"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Comfortable runway</SelectItem>
                    <SelectItem value="tight_3_to_6m">Watch — 3-6 months</SelectItem>
                    <SelectItem value="critical_under_3m">Critical — under 3 months stress</SelectItem>
                    <SelectItem value="growth_strained">Profitable rhythm but strained on growth capex</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button size="lg" type="submit">
              Generate cashflow analysis
            </Button>
          </div>

          <DisclaimerCard body="Runway maths here is illustrative — unify with banker-grade cash forecasts separately." />

          {firstErr ? (
            <p role="alert" className="text-sm text-destructive">
              {firstErr}
            </p>
          ) : null}
        </form>
      ) : (
        <Card className="border-primary/20 bg-gradient-to-br from-card via-background to-background">
          <CardHeader className="gap-4">
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Collection stress: {result?.collectionStressLevel}</Badge>
                <Badge variant="secondary">Stability: {result?.stabilityIndicator}</Badge>
                <Badge variant="secondary">Burn posture: {result?.burnPressureLabel}</Badge>
              </div>
              <ScoreHighlight value={result?.cashflowScore ?? 0} label="Cashflow score" sublabel={result?.maturityLabel} />
            </div>
            <CardDescription className="text-base leading-relaxed">{result?.maturityDescription}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <DimensionBarChart
              title="Scoring dimensions (same engine as headline score)"
              data={result?.chartDimensions ?? []}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Summary title="Estimated runway heuristic" detail={`≈ ${result?.runwayEstimateMonths ?? "–"} months`} />
              <Summary title="Net monthly cash" detail={`${formatAed(result?.netMonthlyAed ?? 0)} per month basis`} />
              <Summary
                title="Collections signal"
                detail={
                  result?.collectionStressLevel === "high"
                    ? "Tight collections risk — escalate aging discipline."
                    : result?.collectionStressLevel === "medium"
                      ? "Operational drag — tighten weekly cadence."
                      : "Relatively disciplined — concentrate on outliers."
                }
              />
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Practical suggestions</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {result?.practicalSuggestions.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </section>

            <CtaRow
              prominent
              toolSlug={TOOL_SLUG}
              whatsappMessage="Hi Finanshels — Cashflow Health Check completed. Need sanity check on runway levers."
            />

            <PrintReport>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cashflow Navigator Summary</p>
                <h2 className="text-xl font-semibold">
                  Score {result?.cashflowScore} • {result?.collectionStressLevel} collection stress • {result?.stabilityIndicator} stability
                </h2>
                <Separator />
                <ul className="text-sm">
                  {(result?.practicalSuggestions ?? []).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </PrintReport>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
              <NextTools tools={getNextRecommendedTools(TOOL_SLUG)} />
            </div>

            <LeadCaptureForm toolSlug={TOOL_SLUG} calculatorInputs={form.getValues()} calculatorOutputs={result ?? {}} />

            <DisclaimerCard body="Not a treasury policy — escalate material liquidity decisions through qualified treasury or banking advisers." />
          </CardContent>
        </Card>
      )}

      <StickyMobileCta
        toolSlug={TOOL_SLUG}
        whatsappMessage="Hi Finanshels — reviewing cashflow Navigator output. Can we sanity check?"
      />
    </div>
  );
}

function Summary({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm text-foreground">{detail}</p>
    </div>
  );
}
