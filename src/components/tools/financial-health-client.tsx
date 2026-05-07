"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { LabeledSlot } from "@/components/forms/labeled-slot";
import { DimensionBarChart } from "@/components/results/dimension-bar-chart";
import { NextTools } from "@/components/results/next-tools";
import { PrintReport } from "@/components/results/print-report";
import { ScoreHighlight } from "@/components/results/score-highlight";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { CtaRow } from "@/components/tools/cta-row";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { WorkflowStatusLine } from "@/components/tools/workflow-status-line";

import { computeFinancialHealth, type FinancialHealthInputs } from "@/lib/scoring/financial-health";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { formatAed } from "@/lib/format/currency";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { toolFunnelContext } from "@/lib/tools/canonical-sequence";
import { toolSessionRequestBody } from "@/lib/tools/tool-session-request";
import { trackEvent } from "@/lib/analytics/track";
import { markToolCompleted } from "@/lib/toolkit-progress";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const schema = z.object({
  monthlyRevenueAed: z.coerce.number().min(0).max(1_500_000_000),
  monthlyExpensesAed: z.coerce.number().min(0).max(1_500_000_000),
  profitMarginBand: z.enum(["negative", "0_5", "5_15", "15_30", "30_plus"]),
  cashReserveMonths: z.coerce.number().min(0).max(240),
  receivableCollectionDays: z.coerce.number().min(0).max(270),
  bookkeepingTimeliness: z.enum(["delayed", "within_15", "within_7", "realtime"]),
  reportingFrequency: z.enum(["ad_hoc", "quarterly", "monthly", "weekly"]),
  vatReadiness: z.enum(["low", "medium", "high"]),
  ctReadiness: z.enum(["low", "medium", "high"]),
  founderDependency: z.enum(["total", "high", "medium", "low"]),
});

const TOOL_SLUG = "financial-health-checkup";
const funnel = toolFunnelContext(TOOL_SLUG);

export function FinancialHealthClient() {
  const token = useAnonymousToken();
  const [submitted, setSubmitted] = useState(false);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      monthlyRevenueAed: 450_000,
      monthlyExpensesAed: 410_000,
      profitMarginBand: "5_15",
      cashReserveMonths: 5,
      receivableCollectionDays: 62,
      bookkeepingTimeliness: "within_15",
      reportingFrequency: "monthly",
      vatReadiness: "medium",
      ctReadiness: "medium",
      founderDependency: "high",
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG, ...funnel });
  }, []);

  const result = submitted ? computeFinancialHealth(form.getValues() as FinancialHealthInputs) : null;

  async function onSubmit(vals: z.infer<typeof schema>) {
    const computed = computeFinancialHealth(vals as FinancialHealthInputs);
    trackEvent("tool_completed", { toolSlug: TOOL_SLUG, healthScore: computed.healthScore, ...funnel });
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
        detail="Straight AED inputs — we compress them into a directional health score and next actions."
      />

      {!submitted ? (
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operational inputs</CardTitle>
              <CardDescription>Use ballpark AED monthly actuals — precision can come later in diligence.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <LabeledSlot label="Monthly revenue (AED)">
                <Input inputMode="decimal" type="number" {...form.register("monthlyRevenueAed")} />
              </LabeledSlot>
              <LabeledSlot label="Monthly expenses (AED)">
                <Input inputMode="decimal" type="number" {...form.register("monthlyExpensesAed")} />
              </LabeledSlot>

              <LabeledSlot label="Profit margin band">
                <Select
                  value={form.watch("profitMarginBand")}
                  onValueChange={(v) =>
                    form.setValue("profitMarginBand", v as FinancialHealthInputs["profitMarginBand"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick band" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negative">Negative cash profit</SelectItem>
                    <SelectItem value="0_5">0% – 5%</SelectItem>
                    <SelectItem value="5_15">5% – 15%</SelectItem>
                    <SelectItem value="15_30">15% – 30%</SelectItem>
                    <SelectItem value="30_plus">30%+</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Cash reserves (months of cover at current tempo)">
                <Input inputMode="decimal" type="number" {...form.register("cashReserveMonths")} />
              </LabeledSlot>

              <LabeledSlot label="Receivable collection cycle (average days)">
                <Input inputMode="decimal" type="number" {...form.register("receivableCollectionDays")} />
              </LabeledSlot>

              <LabeledSlot label="Bookkeeping timeliness">
                <Select
                  value={form.watch("bookkeepingTimeliness")}
                  onValueChange={(v) =>
                    form.setValue("bookkeepingTimeliness", v as FinancialHealthInputs["bookkeepingTimeliness"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delayed">Often delayed (&gt;15 days)</SelectItem>
                    <SelectItem value="within_15">Within ~15 days</SelectItem>
                    <SelectItem value="within_7">Within ~7 days</SelectItem>
                    <SelectItem value="realtime">Near real-time / weekly discipline</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Management reporting frequency">
                <Select
                  value={form.watch("reportingFrequency")}
                  onValueChange={(v) =>
                    form.setValue("reportingFrequency", v as FinancialHealthInputs["reportingFrequency"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ad_hoc">Ad hoc</SelectItem>
                    <SelectItem value="quarterly">Quarterly packs</SelectItem>
                    <SelectItem value="monthly">Monthly packs</SelectItem>
                    <SelectItem value="weekly">Weekly operating cadence</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="VAT readiness posture">
                <Select
                  value={form.watch("vatReadiness")}
                  onValueChange={(v) => form.setValue("vatReadiness", v as FinancialHealthInputs["vatReadiness"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — gaps likely</SelectItem>
                    <SelectItem value="medium">Medium — workable gaps</SelectItem>
                    <SelectItem value="high">High — audit-defensible rhythms</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Corporate tax readiness posture">
                <Select
                  value={form.watch("ctReadiness")}
                  onValueChange={(v) => form.setValue("ctReadiness", v as FinancialHealthInputs["ctReadiness"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — workstreams undefined</SelectItem>
                    <SelectItem value="medium">Medium — partial artefacts</SelectItem>
                    <SelectItem value="high">High — timelines owned</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Founder dependence on approvals & reporting interpretation">
                <Select
                  value={form.watch("founderDependency")}
                  onValueChange={(v) =>
                    form.setValue("founderDependency", v as FinancialHealthInputs["founderDependency"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Almost everything routes through founders</SelectItem>
                    <SelectItem value="high">High — bottlenecked reviews</SelectItem>
                    <SelectItem value="medium">Medium — some delegation</SelectItem>
                    <SelectItem value="low">Low — finance owns cadence</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button size="lg" type="submit">
              Generate health snapshot
            </Button>
          </div>

          <DisclaimerCard body="Health scoring compresses nuanced operating reality — use outputs to provoke decisions, not to replace diligence." />

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
              <CardTitle className="text-2xl font-semibold tracking-tight">Finance health snapshot</CardTitle>
              <ScoreHighlight value={result?.healthScore ?? 0} label="Health score" sublabel={result?.maturityLabel} />
            </div>
            <CardDescription className="text-base leading-relaxed">{result?.maturityDescription}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <DimensionBarChart
              title="Signal strengths (0–100)"
              data={[
                { label: "Margin", value: result?.marginStrength ?? 0 },
                { label: "Reserves", value: result?.reserveStrength ?? 0 },
                { label: "Process", value: result?.processDiscipline ?? 0 },
                { label: "Tax", value: result?.taxReadiness ?? 0 },
                { label: "Founder overload", value: 100 - (result?.founderDependencyRisk ?? 50) },
              ]}
            />
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Interpretation cues</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  AED monthly revenue modeled at approximately <span className="font-medium">{formatAed(form.getValues("monthlyRevenueAed"))}</span>
                  {" "}with expenses near <span className="font-medium">{formatAed(form.getValues("monthlyExpensesAed"))}</span>. Signals below flag where to dig first.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Top issues surfaced</h3>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {result?.topIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Top 3 actions</h3>
              <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                {result?.nextSteps.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
            </section>

            <CtaRow
              prominent
              toolSlug={TOOL_SLUG}
              whatsappMessage="Hi Finanshels — I ran the Financial Health Checkup and want a reviewer on the priorities."
            />

            <PrintReport>
              <header className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Financial Health Summary</p>
                <h2 className="text-xl font-semibold">{result?.healthScore} • {result?.maturityLabel}</h2>
              </header>
              <Separator />
              <ul className="text-sm text-muted-foreground">
                {result?.topIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </PrintReport>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
              <NextTools tools={getNextRecommendedTools(TOOL_SLUG)} />
            </div>

            <LeadCaptureForm toolSlug={TOOL_SLUG} calculatorInputs={form.getValues()} calculatorOutputs={result ?? {}} />

            <DisclaimerCard body="No tax positions or statutory conclusions are asserted here." />
          </CardContent>
        </Card>
      )}
      <StickyMobileCta toolSlug={TOOL_SLUG} whatsappMessage="Hi Finanshels — Financial Health Checkup done, let's discuss sequencing." />
    </div>
  );
}
