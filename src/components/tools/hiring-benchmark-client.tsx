"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

import { LabeledSlot } from "@/components/forms/labeled-slot";
import { DimensionBarChart } from "@/components/results/dimension-bar-chart";
import { NextTools } from "@/components/results/next-tools";
import { PrintReport } from "@/components/results/print-report";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { CtaRow } from "@/components/tools/cta-row";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { WorkflowStatusLine } from "@/components/tools/workflow-status-line";

import { ROLE_SALARY_BENCHMARKS_AED, type RoleBenchmarkKey } from "@/lib/config/benchmarks";
import { computeHiringVsOutsourcing, type HiringBenchmarkInputs } from "@/lib/scoring/hiring-outsourcing";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { formatAed, formatAedCompact } from "@/lib/format/currency";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { trackEvent } from "@/lib/analytics/track";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const roleKeys = Object.keys(ROLE_SALARY_BENCHMARKS_AED) as RoleBenchmarkKey[];

const roleSchema = z.string().refine((v): v is RoleBenchmarkKey => roleKeys.includes(v as RoleBenchmarkKey), {
  message: "Invalid role selection",
});

const schema = z
  .object({
    companyStage: z.enum(["pre_seed", "seed", "series_a", "growth", "enterprise"]),
    industry: z.enum(["saas", "services", "trading_distribution", "other"]),
    revenueBandId: z.string().min(1),
    monthlyTransactionVolume: z.enum(["low", "medium", "high"]),
    teamComplexity: z.enum(["simple", "moderate", "complex"]),

    roles: z.array(roleSchema).min(1, "Pick at least one role archetype"),

    accountant: z.coerce.number().min(0).max(20),
    senior_accountant: z.coerce.number().min(0).max(20),
    finance_manager: z.coerce.number().min(0).max(20),
    financial_controller: z.coerce.number().min(0).max(20),
    fractional_cfo: z.coerce.number().min(0).max(20),

    salaryMode: z.enum(["preset_mid", "custom"]),
    customMonthlySalaryAed: z.coerce.number().min(0).max(500_000).optional(),

    benefitsOverheadPct: z.coerce.number().min(0).max(60),
    visaOnboardingCostAed: z.coerce.number().min(0).max(5_000_000),
    softwareToolingAnnualAed: z.coerce.number().min(0).max(5_000_000),
    managementOverheadPct: z.coerce.number().min(0).max(60),
    attritionReplacementBufferPct: z.coerce.number().min(0).max(60),

    outsourcingUsesRecommendedBandMid: z.boolean(),
    outsourcingMonthlyCostAed: z.coerce.number().min(0).max(2_000_000).optional(),
  })
  .superRefine((data, ctx) => {
    const hires = roleKeys.reduce((sum, key) => sum + (data[key] as number), 0);
    if (hires <= 0) {
      ctx.addIssue({ code: "custom", message: "Add headcount for at least one selected role", path: ["roles"] });
    }
    if (data.salaryMode === "custom" && (data.customMonthlySalaryAed === undefined || data.customMonthlySalaryAed <= 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Custom salary mode requires a positive monthly AED salary baseline",
        path: ["customMonthlySalaryAed"],
      });
    }
    if (
      !data.outsourcingUsesRecommendedBandMid &&
      (data.outsourcingMonthlyCostAed === undefined || Number.isNaN(data.outsourcingMonthlyCostAed) || data.outsourcingMonthlyCostAed <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Enter outsourced monthly AED retainer OR enable recommended heuristic band toggle",
        path: ["outsourcingMonthlyCostAed"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const TOOL_SLUG = "hiring-vs-outsourcing-benchmark";

export function HiringBenchmarkClient() {
  const token = useAnonymousToken();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      companyStage: "seed",
      industry: "saas",
      revenueBandId: "2m_10m",
      monthlyTransactionVolume: "medium",
      teamComplexity: "moderate",

      roles: ["accountant", "finance_manager"],
      accountant: 1,
      senior_accountant: 0,
      finance_manager: 1,
      financial_controller: 0,
      fractional_cfo: 0,

      salaryMode: "preset_mid",
      customMonthlySalaryAed: 25_000,

      benefitsOverheadPct: 18,
      visaOnboardingCostAed: 140_000,
      softwareToolingAnnualAed: 48_000,
      managementOverheadPct: 12,
      attritionReplacementBufferPct: 8,

      outsourcingUsesRecommendedBandMid: false,
      outsourcingMonthlyCostAed: 32_000,
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG });
  }, []);

  const result = submitted ? computeHiringVsOutsourcing(mapFormToBenchmark(form.getValues())) : null;

  function toggleRole(role: RoleBenchmarkKey, checked: boolean) {
    const roles = new Set(form.getValues("roles"));
    if (checked) roles.add(role);
    else roles.delete(role);

    /** reset count when unchecked */
    if (!checked) {
      form.setValue(role, 0, { shouldValidate: true });
    } else if ((form.getValues(role) as number) === 0) {
      form.setValue(role, 1, { shouldValidate: true });
    }

    form.setValue("roles", Array.from(roles) as FormValues["roles"], { shouldValidate: true });
  }

  async function onSubmit(vals: FormValues) {
    const inputs = mapFormToBenchmark(vals);
    const computed = computeHiringVsOutsourcing(inputs);
    trackEvent("tool_completed", { toolSlug: TOOL_SLUG, recommendation: computed.recommendation });
    setSubmitted(true);

    fetch("/api/tool-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolSlug: TOOL_SLUG,
        anonymousToken: token ?? undefined,
        inputs: vals,
        outputs: computed,
      }),
    }).catch(() => undefined);
  }

  const firstErr = getFirstErrorMessage(form.formState.errors);

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <ToolPageHeader slug={TOOL_SLUG} />

      <WorkflowStatusLine
        phase={submitted ? "results" : "inputs"}
        detail="Tune AED benchmarks centrally in lib/config/benchmarks.ts — this UI stays a thin calculator shell."
      />

      {!submitted ? (
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workload & archetype signals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <LabeledSlot label="Company stage">
                <Select
                  value={form.watch("companyStage")}
                  onValueChange={(v) => form.setValue("companyStage", v as FormValues["companyStage"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_seed">Pre-seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="growth">Growth / Series B+</SelectItem>
                    <SelectItem value="enterprise">Enterprise maturity</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
              <LabeledSlot label="Industry">
                <Select
                  value={form.watch("industry")}
                  onValueChange={(v) => form.setValue("industry", v as FormValues["industry"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS / software</SelectItem>
                    <SelectItem value="services">Professional services</SelectItem>
                    <SelectItem value="trading_distribution">Trading / distribution</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
              <LabeledSlot label="Revenue band (AED)">
                <Input placeholder="e.g. 2m_10m" {...form.register("revenueBandId")} />
              </LabeledSlot>
              <LabeledSlot label="Monthly transaction volume">
                <Select
                  value={form.watch("monthlyTransactionVolume")}
                  onValueChange={(v) =>
                    form.setValue("monthlyTransactionVolume", v as FormValues["monthlyTransactionVolume"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
              <LabeledSlot label="Finance team complexity">
                <Select
                  value={form.watch("teamComplexity")}
                  onValueChange={(v) => form.setValue("teamComplexity", v as FormValues["teamComplexity"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple — light GL / cashbook</SelectItem>
                    <SelectItem value="moderate">Moderate — multi-entity / VAT reality</SelectItem>
                    <SelectItem value="complex">Complex — consolidations / group reporting</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role mix & headcount</CardTitle>
              <CardDescription>Select roles you are evaluating and how many seats per role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {roleKeys.map((role) => {
                  const active = form.watch("roles").includes(role);
                  return (
                    <div key={role} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={active} onCheckedChange={(v) => toggleRole(role, Boolean(v))} id={`role-${role}`} />
                        <Label htmlFor={`role-${role}`} className="text-sm leading-tight">
                          {ROLE_SALARY_BENCHMARKS_AED[role].role}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            AED {ROLE_SALARY_BENCHMARKS_AED[role].monthlyMid.toLocaleString()} / mo mid-band
                          </span>
                        </Label>
                      </div>
                      <Input
                        className="w-24"
                        type="number"
                        disabled={!active}
                        {...form.register(role)}
                      />
                    </div>
                  );
                })}
              </div>
              {typeof form.formState.errors.roles?.message === "string" ? (
                <p className="text-xs text-destructive">{form.formState.errors.roles.message}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Economics overlays</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <LabeledSlot label="Salary mode">
                <Select
                  value={form.watch("salaryMode")}
                  onValueChange={(v) => form.setValue("salaryMode", v as FormValues["salaryMode"], { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset_mid">Benchmark mid tables</SelectItem>
                    <SelectItem value="custom">Single custom AED monthly baseline applied</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
              <LabeledSlot label="Custom monthly AED salary baseline (when custom mode enabled)">
                <Input disabled={form.watch("salaryMode") !== "custom"} type="number" {...form.register("customMonthlySalaryAed")} />
              </LabeledSlot>
              <LabeledSlot label="Benefits & mandated load (% of salaries)">
                <Input type="number" {...form.register("benefitsOverheadPct")} />
              </LabeledSlot>
              <LabeledSlot label="Visa & onboarding amortized annually (AED)">
                <Input type="number" {...form.register("visaOnboardingCostAed")} />
              </LabeledSlot>
              <LabeledSlot label="Software & tooling annually (ERP, OCR, approvals) AED">
                <Input type="number" {...form.register("softwareToolingAnnualAed")} />
              </LabeledSlot>
              <LabeledSlot label="Management overhead (% of loaded payroll)">
                <Input type="number" {...form.register("managementOverheadPct")} />
              </LabeledSlot>
              <LabeledSlot label="Attrition / replacement shock buffer (% of payroll)">
                <Input type="number" {...form.register("attritionReplacementBufferPct")} />
              </LabeledSlot>

              <div className="md:col-span-2 space-y-3 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="heuristic"
                    checked={form.watch("outsourcingUsesRecommendedBandMid")}
                    onCheckedChange={(v) => form.setValue("outsourcingUsesRecommendedBandMid", Boolean(v), { shouldValidate: true })}
                  />
                  <Label htmlFor="heuristic" className="text-sm leading-snug">
                    Use heuristic outsourced retainer midpoint (when you intentionally skip an explicit AED retainer capture)
                  </Label>
                </div>
                <LabeledSlot label="Outsourced finance retainer (AED / month)">
                  <Input
                    disabled={form.watch("outsourcingUsesRecommendedBandMid")}
                    type="number"
                    {...form.register("outsourcingMonthlyCostAed")}
                  />
                </LabeledSlot>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button size="lg" type="submit">
              Compare build vs outsource
            </Button>
          </div>

          <DisclaimerCard body="Benchmarks are directional market anchors — Finanshels proposals may differ after scoping." />

          {firstErr ? (
            <p role="alert" className="text-sm text-destructive">
              {firstErr}
            </p>
          ) : null}
        </form>
      ) : (
        <Card className="border-primary/25 bg-gradient-to-br from-card via-background to-background">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Likely setup: {result?.recommendation.replaceAll("_", " ")}</Badge>
              <Badge variant="secondary">
                Annual delta ≈ {formatAedCompact(result?.costDifferenceAnnual ?? 0)} (
                {(result?.costDifferenceAnnual ?? 0) >= 0 ? "in-house premium" : "outsource premium"})
              </Badge>
            </div>
            <CardDescription className="text-base leading-relaxed">{result?.outsourcingNote}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Score title="Loaded in-house (annual)" value={formatAed(result?.totalAnnualInHouse ?? 0)} />
              <Score title="Outsourced model (annual)" value={formatAed(result?.totalAnnualOutsourced ?? 0)} />
              <Score title="Hidden overheads (annual)" value={formatAed(result?.hiddenOverheadsAnnual ?? 0)} />
            </div>

            <DimensionBarChart
              title="Relative cost indices (0–100 scale for chart readability)"
              data={[
                { label: "In-house eff. monthly", value: normalizeCost(result?.effectiveMonthlyInHouse ?? 0) },
                { label: "Outsource eff. monthly", value: normalizeCost(result?.effectiveMonthlyOutsourced ?? 0) },
                { label: "Hidden load index", value: clampPctIndex(result?.hiddenOverheadsAnnual ?? 0, result?.totalAnnualInHouse ?? 1) },
              ]}
            />

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Sensitivity</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{result?.sensitivityNote}</p>
            </section>

            <CtaRow
              prominent
              toolSlug={TOOL_SLUG}
              whatsappMessage="Hi Finanshels — hiring vs outsourcing benchmark done. Need a scoped proposal."
            />

            <PrintReport>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hiring vs outsourcing summary</p>
                <h2 className="text-xl font-semibold">
                  {result?.recommendation.toUpperCase()} • delta {formatAed(result?.costDifferenceAnnual ?? 0)}
                </h2>
                <Separator />
                <ul className="text-sm text-muted-foreground">
                  <li>In-house annual: {formatAed(result?.totalAnnualInHouse ?? 0)}</li>
                  <li>Outsourced annual: {formatAed(result?.totalAnnualOutsourced ?? 0)}</li>
                  <li>Hidden overheads: {formatAed(result?.hiddenOverheadsAnnual ?? 0)}</li>
                </ul>
              </div>
            </PrintReport>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
              <NextTools tools={getNextRecommendedTools(TOOL_SLUG)} />
            </div>

            <LeadCaptureForm toolSlug={TOOL_SLUG} calculatorInputs={form.getValues()} calculatorOutputs={result ?? {}} />

            <DisclaimerCard body="No employment law, visa, or Emiratisation guidance is embedded — engage specialists for policy truth." />
          </CardContent>
        </Card>
      )}

      <StickyMobileCta toolSlug={TOOL_SLUG} whatsappMessage="Hi Finanshels — hiring vs outsourcing model needs validation." />
    </div>
  );
}

function mapFormToBenchmark(vals: FormValues): HiringBenchmarkInputs {
  const numberOfHiresByRole: Partial<Record<RoleBenchmarkKey, number>> = {};
  for (const key of roleKeys) {
    const n = vals[key] as number;
    if (n > 0) numberOfHiresByRole[key] = n;
  }

  return {
    companyStage: vals.companyStage,
    industry: vals.industry,
    revenueBandId: vals.revenueBandId,
    monthlyTransactionVolume: vals.monthlyTransactionVolume,
    teamComplexity: vals.teamComplexity,
    roles: vals.roles,
    numberOfHiresByRole,
    salaryMode: vals.salaryMode,
    customMonthlySalaryAed: vals.customMonthlySalaryAed,
    benefitsOverheadPct: vals.benefitsOverheadPct,
    visaOnboardingCostAed: vals.visaOnboardingCostAed,
    softwareToolingAnnualAed: vals.softwareToolingAnnualAed,
    managementOverheadPct: vals.managementOverheadPct,
    attritionReplacementBufferPct: vals.attritionReplacementBufferPct,
    outsourcingMonthlyCostAed: vals.outsourcingUsesRecommendedBandMid ? null : vals.outsourcingMonthlyCostAed ?? null,
    outsourcingUsesRecommendedBandMid: vals.outsourcingUsesRecommendedBandMid,
  };
}

function Score({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function normalizeCost(monthly: number) {
  /** compress into 0-100 scale for charting */
  const ref = 120_000;
  return Math.min(100, Math.round((monthly / ref) * 100));
}

function clampPctIndex(hidden: number, base: number) {
  if (base <= 0) return 50;
  return Math.min(100, Math.round((hidden / base) * 100));
}
