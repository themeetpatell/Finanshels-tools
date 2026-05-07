"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
import { Slider } from "@/components/ui/slider";

import { LabeledSlot } from "@/components/forms/labeled-slot";
import { NextTools } from "@/components/results/next-tools";
import { PrintReport } from "@/components/results/print-report";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";

import { ROLE_SALARY_BENCHMARKS_AED, type RoleBenchmarkKey } from "@/lib/config/benchmarks";
import {
  computeDetailedEmployerCost,
  defaultStatutoryFromSalary,
  type SoftwareSkuId,
  sumSoftwareAnnual,
} from "@/lib/scoring/hiring-employer-detail";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { formatAed, formatAedCompact } from "@/lib/format/currency";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { toolFunnelContext } from "@/lib/tools/canonical-sequence";
import { toolSessionRequestBody } from "@/lib/tools/tool-session-request";
import { trackEvent } from "@/lib/analytics/track";
import { markToolCompleted } from "@/lib/toolkit-progress";
import { firstNameFromFullName, readLeadIdentity } from "@/lib/lead-identity-storage";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";
import { site, whatsappHref } from "@/lib/config/site";

const roleKeys = Object.keys(ROLE_SALARY_BENCHMARKS_AED) as RoleBenchmarkKey[];

const GATE_STORAGE = "fn_hiring_benchmark_gate_v1";
const TOOL_SLUG = "hiring-vs-outsourcing-benchmark" as const;
const funnel = toolFunnelContext(TOOL_SLUG);

const skuIds = ["xero", "quickbooks", "zoho", "tally", "sap_oracle", "unsure"] as const satisfies readonly SoftwareSkuId[];

const gateSchema = z.object({
  firstName: z.string().min(1).max(80),
  workEmail: z.string().email(),
  companyName: z.string().min(1).max(160),
  companySize: z.string().min(1),
  consentAccepted: z.boolean().refine(Boolean, "Required to proceed."),
});

const roleKeySchema = z.enum(
  roleKeys as unknown as [RoleBenchmarkKey, ...RoleBenchmarkKey[]],
);

const configureSchema = z.object({
  roleKey: roleKeySchema,
  visaMedicalInsuranceAed: z.coerce.number().min(0).max(1_000_000),
  annualLeaveProvisionAed: z.coerce.number().min(0),
  gratuityYear1AccrualAed: z.coerce.number().min(0),
  noticePeriodBufferAed: z.coerce.number().min(0),
  workspace: z.enum(["full_office", "hybrid", "fully_remote"]),
  officeLocationLabel: z.string().min(1).max(120),
  monthlyDeskCostAed: z.coerce.number().min(0).max(200_000),
  hardwareMode: z.enum(["laptop_8k", "laptop_15k", "none"]),
  managementHourlyRateAed: z.coerce.number().min(100).max(5000),
});

type GateValues = z.infer<typeof gateSchema>;
type ConfigureValues = z.infer<typeof configureSchema>;

const toneDot: Record<string, string> = {
  salary: "bg-purple-600",
  visa: "bg-sky-500",
  statutory: "bg-emerald-500",
  office: "bg-neutral-900",
  software: "bg-neutral-400",
  hardware: "bg-amber-400",
  time: "bg-rose-300",
  other: "bg-muted",
};

export function HiringBenchmarkClient() {
  const token = useAnonymousToken();
  /** 1 gate · 2 configure · 3 results */
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  /** Micro-steps inside phase 2 (1–6) — forward jumps disabled until unlocked via Continue */
  const [subStep, setSubStep] = useState(1);
  const [furthestConfigureStep, setFurthestConfigureStep] = useState(1);
  const [expectedMonthlySalaryAed, setExpectedMonthlySalaryAed] = useState(11_000);
  const [selectedSkus, setSelectedSkus] = useState<SoftwareSkuId[]>(["xero"]);
  const [managementHoursPerWeek, setManagementHoursPerWeek] = useState(5);

  const [gateProfile, setGateProfile] = useState<GateValues | null>(null);
  const [detailResult, setDetailResult] = useState<ReturnType<typeof computeDetailedEmployerCost> | null>(null);

  const gateForm = useForm<GateValues>({
    resolver: zodResolver(gateSchema),
    defaultValues: { consentAccepted: false, companySize: "" },
  });

  const cfgForm = useForm<ConfigureValues>({
    resolver: zodResolver(configureSchema) as Resolver<ConfigureValues>,
    defaultValues: {
      roleKey: "accountant",
      visaMedicalInsuranceAed: 12_000,
      annualLeaveProvisionAed: defaultStatutoryFromSalary(11_000).annualLeaveProvisionAed,
      gratuityYear1AccrualAed: defaultStatutoryFromSalary(11_000).gratuityYear1AccrualAed,
      noticePeriodBufferAed: defaultStatutoryFromSalary(11_000).noticePeriodBufferAed,
      workspace: "hybrid",
      officeLocationLabel: "Business Bay",
      monthlyDeskCostAed: 2200,
      hardwareMode: "laptop_8k",
      managementHourlyRateAed: 500,
    },
  });

  const watchedRole = cfgForm.watch("roleKey") as RoleBenchmarkKey;
  const bench = ROLE_SALARY_BENCHMARKS_AED[watchedRole] ?? ROLE_SALARY_BENCHMARKS_AED.accountant;

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG, ...funnel });
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GATE_STORAGE);
      if (raw) {
        const p = JSON.parse(raw) as GateValues;
        if (p?.firstName && p?.workEmail) {
          setGateProfile(p);
          setPhase(2);
        }
        return;
      }
      const identity = readLeadIdentity();
      if (!identity?.workEmail) return;
      const synthesized: GateValues = {
        firstName: firstNameFromFullName(identity.fullName),
        workEmail: identity.workEmail,
        companyName: identity.companyName,
        companySize: identity.companySize,
        consentAccepted: true,
      };
      sessionStorage.setItem(GATE_STORAGE, JSON.stringify(synthesized));
      setGateProfile(synthesized);
      setPhase(2);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setExpectedMonthlySalaryAed(bench.monthlyMid);
  }, [watchedRole, bench.monthlyMid]);

  useEffect(() => {
    const d = defaultStatutoryFromSalary(expectedMonthlySalaryAed);
    cfgForm.setValue("annualLeaveProvisionAed", d.annualLeaveProvisionAed);
    cfgForm.setValue("gratuityYear1AccrualAed", d.gratuityYear1AccrualAed);
    cfgForm.setValue("noticePeriodBufferAed", d.noticePeriodBufferAed);
  }, [expectedMonthlySalaryAed, cfgForm]);

  const watchedPartial = useWatch({ control: cfgForm.control });
  const watchedCfg = { ...cfgForm.getValues(), ...watchedPartial } as ConfigureValues;
  const hwPreview =
    watchedCfg.hardwareMode === "laptop_8k" ? 8000 : watchedCfg.hardwareMode === "laptop_15k" ? 15_000 : 0;
  const livePreview = computeDetailedEmployerCost({
    roleKey: watchedCfg.roleKey,
    expectedMonthlySalaryAed,
    visaMedicalInsuranceAed: Number(watchedCfg.visaMedicalInsuranceAed),
    annualLeaveProvisionAed: Number(watchedCfg.annualLeaveProvisionAed),
    gratuityYear1AccrualAed: Number(watchedCfg.gratuityYear1AccrualAed),
    noticePeriodBufferAed: Number(watchedCfg.noticePeriodBufferAed),
    workspace: watchedCfg.workspace,
    officeLocationLabel: watchedCfg.officeLocationLabel,
    monthlyDeskCostAed: Number(watchedCfg.monthlyDeskCostAed),
    softwareAnnualAed: sumSoftwareAnnual(selectedSkus),
    hardwareOneOffAed: hwPreview,
    hardwareAmortYears: 3,
    managementHoursPerWeek,
    managementHourlyRateAed: Number(watchedCfg.managementHourlyRateAed),
  });

  function toggleSku(id: SoftwareSkuId, checked: boolean) {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      const arr = Array.from(next) as SoftwareSkuId[];
      if (arr.length === 0) return ["unsure"];
      return arr;
    });
  }

  async function onGateSubmit(values: GateValues) {
    gateForm.clearErrors();
    try {
      const res = await fetch("/api/leads/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sourceToolSlug: TOOL_SLUG,
        }),
      });
      if (!res.ok) throw new Error("gate_failed");
      trackEvent("tool_gate_completed", { toolSlug: TOOL_SLUG, ...funnel });
    } catch {
      /** Still proceed — funnel must not brick offline */
      trackEvent("tool_gate_completed", { toolSlug: TOOL_SLUG, mode: "degraded", ...funnel });
    }
    sessionStorage.setItem(GATE_STORAGE, JSON.stringify(values));
    setGateProfile(values);
    setPhase(2);
    setSubStep(1);
    setFurthestConfigureStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildDetailFromForm(): ReturnType<typeof computeDetailedEmployerCost> {
    const cfg = cfgForm.getValues();
    const hw =
      cfg.hardwareMode === "laptop_8k" ? 8000 : cfg.hardwareMode === "laptop_15k" ? 15_000 : 0;
    return computeDetailedEmployerCost({
      roleKey: cfg.roleKey,
      expectedMonthlySalaryAed,
      visaMedicalInsuranceAed: cfg.visaMedicalInsuranceAed,
      annualLeaveProvisionAed: cfg.annualLeaveProvisionAed,
      gratuityYear1AccrualAed: cfg.gratuityYear1AccrualAed,
      noticePeriodBufferAed: cfg.noticePeriodBufferAed,
      workspace: cfg.workspace,
      officeLocationLabel: cfg.officeLocationLabel,
      monthlyDeskCostAed: cfg.monthlyDeskCostAed,
      softwareAnnualAed: sumSoftwareAnnual(selectedSkus),
      hardwareOneOffAed: hw,
      hardwareAmortYears: 3,
      managementHoursPerWeek,
      managementHourlyRateAed: cfg.managementHourlyRateAed,
    });
  }

  async function finalizeCalculator() {
    const ok = await cfgForm.trigger();
    if (!ok) return;
    const computed = buildDetailFromForm();
    trackEvent("tool_completed", {
      toolSlug: TOOL_SLUG,
      totalAnnual: computed.totalAnnual,
      roleKey: cfgForm.getValues("roleKey"),
      ...funnel,
    });
    setDetailResult(computed);
    markToolCompleted(TOOL_SLUG);
    setPhase(3);

    fetch("/api/tool-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        toolSessionRequestBody(TOOL_SLUG, token, {
          gate: gateProfile,
          configure: cfgForm.getValues(),
          expectedMonthlySalaryAed,
          selectedSkus,
          managementHoursPerWeek,
        },
        computed),
      ),
    }).catch(() => undefined);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recalculate() {
    setPhase(2);
    setSubStep(6);
    setFurthestConfigureStep(6);
    setDetailResult(null);
  }

  const stepLabel =
    phase === 1 ? "Step 1 of 3" : phase === 2 ? "Step 2 of 3" : "Step 3 of 3";

  const cfgErr = getFirstErrorMessage(cfgForm.formState.errors);
  const gateErr = getFirstErrorMessage(gateForm.formState.errors);

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <ToolRibbon stepLabel={stepLabel} />

      {phase === 1 ? (
        <div className="grid gap-10 lg:grid-cols-[1fr,minmax(340px,420px)] lg:items-start">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Hiring cost benchmark · 2024–2026</p>
            <h1 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
              Find what it truly costs to put a UAE finance hire on payroll.
            </h1>
            <p className="max-w-xl text-muted-foreground leading-relaxed">
              Salary is only part of it — visa load, statute, workspace, tooling, amortised hardware, and your review time pile up quickly. Unlock a
              structured employer model calibrated to Emirates practice.
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>📊 Grounded scoring from Finanshels benchmark tables plus UAE-shaped statutory stubs.</li>
              <li>🔒 Gate step captures your work identity so we never treat serious operators as anonymous traffic.</li>
              <li>⏱ Roughly two active minutes once you&apos;re inside the estimator.</li>
            </ul>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Tell us about your business</CardTitle>
              <CardDescription>We tailor the benchmarking context and where to route follow-up.</CardDescription>
            </CardHeader>
            <form className="space-y-4 px-6 pb-6" onSubmit={gateForm.handleSubmit(onGateSubmit)} noValidate>
              <FormFieldCompact label="First name" htmlFor="g-fn">
                <Input id="g-fn" {...gateForm.register("firstName")} autoComplete="given-name" placeholder="Your first name" />
              </FormFieldCompact>
              <FormFieldCompact label="Work email" hint="We'll send escalation touchpoints here" htmlFor="g-em">
                <Input id="g-em" type="email" {...gateForm.register("workEmail")} autoComplete="email" placeholder="you@company.com" />
              </FormFieldCompact>
              <FormFieldCompact label="Company" htmlFor="g-co">
                <Input id="g-co" {...gateForm.register("companyName")} autoComplete="organization" placeholder="Company name" />
              </FormFieldCompact>
              <div className="space-y-2">
                <Label htmlFor="g-sz">Company size</Label>
                <Select
                  value={gateForm.watch("companySize")}
                  onValueChange={(v) => {
                    if (typeof v === "string" && v) gateForm.setValue("companySize", v, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger id="g-sz">
                    <SelectValue placeholder="Select company size..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1–5 employees</SelectItem>
                    <SelectItem value="6-20">6–20 employees</SelectItem>
                    <SelectItem value="21-50">21–50 employees</SelectItem>
                    <SelectItem value="51-200">51–200 employees</SelectItem>
                    <SelectItem value="201-plus">201+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                <Checkbox
                  checked={gateForm.watch("consentAccepted")}
                  onCheckedChange={(v) => gateForm.setValue("consentAccepted", Boolean(v), { shouldValidate: true })}
                  id="g-cons"
                />
                <label htmlFor="g-cons" className="cursor-pointer text-sm leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">No spam commitment</span> — Finanshels may email me benchmark outputs tied to this
                  session only. Calls only if I request them.
                </label>
              </div>
              {gateErr ? (
                <p className="text-sm text-destructive" role="alert">
                  {gateErr}
                </p>
              ) : null}
              <Button type="submit" className="w-full" size="lg">
                Show me the cost benchmark →
              </Button>
              <DisclaimerCard compact body="Signals are illustrative — corroborate visas, medicals, and gratuity maths with UAE counsel + payroll." />
            </form>
          </Card>
        </div>
      ) : null}

      {phase === 2 ? (
        <div className="space-y-8">
          <header className="space-y-2">
            <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              Configure the hire — expose one block at a time.
            </h2>
            <p className="max-w-2xl text-muted-foreground leading-relaxed">
              Sub-step {subStep} of 6 · Live totals stay pinned so CFOs watch loaded cost evolve without scrolling back.
            </p>
          </header>

          <nav className="flex flex-wrap gap-2" aria-label="Estimator sections">
            {(
              [
                [1, "Role"],
                [2, "Visa"],
                [3, "Statutory"],
                [4, "Space"],
                [5, "Stack"],
                [6, "Time"],
              ] as const
            ).map(([n, label]) => {
              const locked = n > furthestConfigureStep;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    if (!locked) setSubStep(n);
                  }}
                  title={locked ? "Complete earlier blocks first" : label}
                  className={
                    locked
                      ? "cursor-not-allowed rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground opacity-55"
                      : n === subStep
                        ? "min-w-[2.75rem] rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        : n < subStep
                          ? "rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          : "rounded-full border border-primary/25 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
                  }
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="space-y-6">
              <form className="space-y-8" noValidate>
                <section hidden={subStep !== 1} className={subStep !== 1 ? "hidden" : "space-y-4"} aria-hidden={subStep !== 1}>
                  <SectionCard step={1} title="Role & salary" subtitle="Pick seniority · drag market cash within the AED band Finanshels tracks locally.">
                    <LabeledSlot label="Job title">
                      <Select
                        value={watchedRole}
                        onValueChange={(v) => cfgForm.setValue("roleKey", v as RoleBenchmarkKey, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleKeys.map((k) => (
                            <SelectItem key={k} value={k}>
                              {ROLE_SALARY_BENCHMARKS_AED[k].role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledSlot>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Expected monthly salary · AED</span>
                        <span className="text-primary">{formatAedCompact(expectedMonthlySalaryAed)} / mo</span>
                      </div>
                      <Slider
                        min={bench.monthlyLow}
                        max={bench.monthlyHigh}
                        step={250}
                        value={[expectedMonthlySalaryAed]}
                        onValueChange={(next) => {
                          const arr = Array.isArray(next) ? next : [next];
                          const val = arr[0];
                          if (typeof val === "number") setExpectedMonthlySalaryAed(val);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        UAE posture for this archetype tends to settle between AED {bench.monthlyLow.toLocaleString()} –{" "}
                        {bench.monthlyHigh.toLocaleString()}/mo before loaded employer effects.
                      </p>
                    </div>
                  </SectionCard>
                </section>

                <section hidden={subStep !== 2} className={subStep !== 2 ? "hidden" : "space-y-4"}>
                  <SectionCard step={2} title="Visa & residency load" subtitle="Bake in first-cycle Ministry / medical / Emirates ID realism.">
                    <LabeledSlot label="Visa + Emirates ID + medical / insurance bundle (annualised first-year AED)">
                      <Input type="number" {...cfgForm.register("visaMedicalInsuranceAed")} />
                    </LabeledSlot>
                    <p className="text-xs text-muted-foreground">
                      Larger entities often spread multiple cycles — still enter the cash you expect out the door Year 1.
                    </p>
                  </SectionCard>
                </section>

                <section hidden={subStep !== 3} className={subStep !== 3 ? "hidden" : "space-y-4"}>
                  <SectionCard step={3} title="Statutory obligations" subtitle="UAE labour floor signals — tweak if payroll already models provisions.">
                    <div className="grid gap-4 md:grid-cols-3">
                      <LabeledSlot label="Annual leave provision (AED)">
                        <Input type="number" {...cfgForm.register("annualLeaveProvisionAed")} />
                      </LabeledSlot>
                      <LabeledSlot label="Gratuity accrual Y1 (AED)">
                        <Input type="number" {...cfgForm.register("gratuityYear1AccrualAed")} />
                      </LabeledSlot>
                      <LabeledSlot label="Notice / EOS buffer (AED)">
                        <Input type="number" {...cfgForm.register("noticePeriodBufferAed")} />
                      </LabeledSlot>
                    </div>
                  </SectionCard>
                </section>

                <section hidden={subStep !== 4} className={subStep !== 4 ? "hidden" : "space-y-4"}>
                  <SectionCard step={4} title="Workspace economics" subtitle="Desk multipliers follow Finanshels hybrid vs full-time models.">
                    <div className="grid gap-4 md:grid-cols-3">
                      {(
                        [
                          ["full_office", "Full-time office"],
                          ["hybrid", "Hybrid (3 days)"],
                          ["fully_remote", "Fully remote"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => cfgForm.setValue("workspace", val, { shouldValidate: true })}
                          className={
                            cfgForm.watch("workspace") === val
                              ? "rounded-xl border-2 border-primary bg-primary/5 p-4 text-left text-sm font-medium"
                              : "rounded-xl border p-4 text-left text-sm font-medium hover:bg-muted/40"
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <LabeledSlot label="Office / desk location search">
                      <Input {...cfgForm.register("officeLocationLabel")} placeholder="Business Bay, DMCC, ADGM…" />
                    </LabeledSlot>
                    <LabeledSlot label="Monthly desk / seat cost (AED)">
                      <Input type="number" {...cfgForm.register("monthlyDeskCostAed")} />
                    </LabeledSlot>
                  </SectionCard>
                </section>

                <section hidden={subStep !== 5} className={subStep !== 5 ? "hidden" : "space-y-4"}>
                  <SectionCard step={5} title="Accounting stack & capex" subtitle="Finance tooling + depreciable hardware amortised deliberately.">
                    <p className="text-sm font-medium">Accounting software cadence</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {skuIds.map((sku) => {
                        const sel = selectedSkus.includes(sku);
                        const label =
                          sku === "sap_oracle"
                            ? "SAP / Oracle tier"
                            : sku === "unsure"
                              ? "Other / unsure"
                              : sku.charAt(0).toUpperCase() + sku.slice(1);
                        const cents = sku === "unsure" ? "—" : `${sku === "xero" ? 150 : sku === "quickbooks" ? 120 : sku === "zoho" ? 80 : sku === "tally" ? 60 : 800}/mo`;
                        return (
                          <button
                            type="button"
                            key={sku}
                            onClick={() => toggleSku(sku, !sel)}
                            className={
                              sel
                                ? "flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 px-4 py-3 text-left text-sm"
                                : "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm hover:bg-muted/50"
                            }
                          >
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">{sku === "unsure" ? "—" : `AED ${cents}`}</span>
                          </button>
                        );
                      })}
                    </div>
                    <LabeledSlot label="Hardware provision">
                      <Select
                        value={cfgForm.watch("hardwareMode")}
                        onValueChange={(v) => cfgForm.setValue("hardwareMode", v as ConfigureValues["hardwareMode"], { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laptop_8k">Laptop bundle (~AED 8k amortised)</SelectItem>
                          <SelectItem value="laptop_15k">Workstation-grade (~AED 15k amortised)</SelectItem>
                          <SelectItem value="none">BYOD / no hardware budget</SelectItem>
                        </SelectContent>
                      </Select>
                    </LabeledSlot>
                  </SectionCard>
                </section>

                <section hidden={subStep !== 6} className={subStep !== 6 ? "hidden" : "space-y-4"}>
                  <SectionCard step={6} title="Executive review load" subtitle="Typically the stealth line item founders forget until month three.">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Hours / week supervising or reviewing outputs</span>
                        <Badge variant="outline">{managementHoursPerWeek}h</Badge>
                      </div>
                      <Slider
                        min={0}
                        max={25}
                        step={1}
                        value={[managementHoursPerWeek]}
                        onValueChange={(next) => {
                          const arr = Array.isArray(next) ? next : [next];
                          const v = arr[0];
                          if (typeof v === "number") setManagementHoursPerWeek(v);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Valued conservatively — adjust hourly burden if partner time clears faster.
                      </p>
                      <LabeledSlot label="Implied AED / hour for your review time">
                        <Input type="number" {...cfgForm.register("managementHourlyRateAed")} />
                      </LabeledSlot>
                    </div>
                  </SectionCard>
                </section>

                {cfgErr ? (
                  <p className="text-sm text-destructive" role="alert">
                    {cfgErr}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-between gap-3 border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSubStep((s) => Math.max(1, s - 1));
                    }}
                    disabled={subStep <= 1}
                  >
                    Back
                  </Button>
                  {subStep < 6 ? (
                    <Button
                      type="button"
                      className="ml-auto"
                      onClick={() => {
                        cfgForm.trigger().catch(() => undefined);
                        setSubStep((s) => {
                          const next = Math.min(6, s + 1);
                          setFurthestConfigureStep((f) => Math.max(f, next));
                          return next;
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Continue · next block
                    </Button>
                  ) : (
                    <Button type="button" className="ml-auto" size="lg" onClick={() => void finalizeCalculator()}>
                      See my full cost breakdown →
                    </Button>
                  )}
                </div>
              </form>
            </div>

            <LiveEstimateAside preview={livePreview} />
          </div>
          <DisclaimerCard body="Totals assume single-seat economics; multi-seat rollouts amplify visa and stack spend — ask Finanshels for capex phased plans." />
        </div>
      ) : null}

      {phase === 3 && detailResult && gateProfile ? (
        <ResultsPhase
          detail={detailResult}
          gateProfile={gateProfile}
          whatsappHref={whatsappHref(`Hi Finanshels — ${gateProfile.firstName} completed the UAE hiring benchmark. Estimate AED ${detailResult.totalAnnual.toLocaleString()} loaded. Discuss fit?`)}
          onRecalculate={recalculate}
        />
      ) : null}

      {phase !== 3 ? <StickyMobileCta toolSlug={TOOL_SLUG} whatsappMessage="Hi Finanshels — navigating hiring benchmark UX." /> : null}
    </div>
  );
}

function ToolRibbon({ stepLabel }: { stepLabel: string }) {
  return (
    <div className="-mx-4 flex flex-wrap items-center justify-between gap-3 rounded-none border-y border-[#082032]/20 bg-[#082032] px-4 py-3 text-[11px] font-semibold tracking-wide text-white sm:mx-0 sm:rounded-xl">
      <span className="uppercase">{site.company}</span>
      <span className="text-center uppercase opacity-90">UAE Finance Hiring Cost Benchmark</span>
      <span>{stepLabel}</span>
    </div>
  );
}

function FormFieldCompact({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold text-primary">{step}</p>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function LiveEstimateAside({ preview }: { preview: ReturnType<typeof computeDetailedEmployerCost> }) {
  const maxSeg = preview.lines.reduce((m, l) => Math.max(m, l.annualAed), 1);
  const segs = preview.lines.filter((l) => l.annualAed > 0);

  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      <Card className="border-primary/30 shadow-md">
        <CardHeader>
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-muted-foreground">Live estimate</p>
          <CardTitle className="text-base">Loaded employer posture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Monthly</p>
            <p className="text-xl font-semibold">{formatAed(preview.monthlyTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Annual</p>
            <p className="text-3xl font-bold text-primary">{formatAed(preview.totalAnnual)}</p>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {segs.map((l) => (
              <div
                key={l.id}
                className={toneDot[l.tone] ?? "bg-muted"}
                style={{ flexGrow: Math.max(0.06, l.annualAed / maxSeg), minWidth: 4 }}
              />
            ))}
          </div>
          <ul className="space-y-2 text-xs">
            {preview.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${toneDot[l.tone] ?? "bg-muted"}`} />
                  {l.label}
                </span>
                <span className="font-semibold">{formatAedCompact(l.annualAed)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <DisclaimerCard compact body="Refresh changes instantly — totals are illustrative until validated by advisers." />
    </aside>
  );
}

function ResultsPhase({
  detail,
  gateProfile,
  whatsappHref: wa,
  onRecalculate,
}: {
  detail: ReturnType<typeof computeDetailedEmployerCost>;
  gateProfile: GateValues;
  whatsappHref: string;
  onRecalculate: () => void;
}) {
  const fin = detail.finanshelsFromAnnual;
  const save = detail.estimatedSavingVsFinanshels;

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Personalised for {gateProfile.firstName} · {gateProfile.companyName}
        </p>
        <h2 className="text-balance text-3xl font-semibold md:text-[2rem]">
          Here&apos;s what hiring <span className="lowercase">{detail.roleLabel}</span> lands at once UAE employer load is layered in.
        </h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Full cost breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-3 pr-4 font-medium">Cost component</th>
                <th className="pb-3 font-semibold text-foreground">Annual (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {detail.lines.map((l) => (
                <tr key={l.id}>
                  <td className="flex items-center gap-2 py-3 pr-4">
                    <span className={`size-2 shrink-0 rounded-full ${toneDot[l.tone] ?? "bg-muted"}`} />
                    {l.label}
                  </td>
                  <td className="py-3 font-medium tabular-nums">{formatAed(l.annualAed)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/10 text-primary">
                <td className="rounded-bl-lg px-2 py-4 font-semibold">Total employer posture</td>
                <td className="rounded-br-lg px-2 py-4 text-xl font-bold tabular-nums">{formatAed(detail.totalAnnual)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Compared to directional peer bands</h3>
        <p className="text-sm text-muted-foreground">Synthetic ranges derived from archetype midpoint + minimalist employer load — tighten with Finanshels peer files.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {detail.peers.map((p) => (
            <Card
              key={p.label}
              className={p.typical ? "border-primary shadow-sm" : p.yours ? "border-destructive/40 shadow-sm" : ""}
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  {p.typical ? <Badge>TYPICAL</Badge> : null}
                  <CardTitle className="text-base">{p.label}</CardTitle>
                </div>
                <CardDescription>{p.hint}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-semibold tabular-nums ${p.yours ? "text-destructive" : ""}`}>{formatAed(p.annualAed)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-muted/40 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-primary">Alternative worth modelling</p>
        <h3 className="text-xl font-semibold">What if you leaned on offshore Finanshels capacity instead?</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">&nbsp;</th>
                <th className="py-3 font-semibold text-foreground">In-house posture</th>
                <th className="py-3 font-semibold text-primary">Finanshels remote accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 font-medium">Annual posture</td>
                <td className="tabular-nums">{formatAed(detail.totalAnnual)}</td>
                <td className="tabular-nums">From {formatAedCompact(fin)}/yr*</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Visa runway</td>
                <td>Yes</td>
                <td>No (remote)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Gratuity footprint</td>
                <td>Present</td>
                <td>Structural reduction</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Bench depth if someone exits</td>
                <td>Fragile (&lt;5 seat teams)</td>
                <td>Shared pod cover</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-emerald-950/5 px-4 py-4 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wide">Estimated delta vs illustrative Finanshels floor</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-200">
            AED {save.toLocaleString()} / yr directional savings headroom vs your loaded hire model*
          </p>
        </div>
        <p className="text-xs text-muted-foreground">*Indicative only — validated post discovery call + scope workbook.</p>
      </section>

      <Card className="border-primary bg-[#082032] text-[#FFF7E9]">
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-primary">Final conversational step</p>
          <CardTitle className="text-2xl text-[#FFF7E9]">{gateProfile.firstName}, want a staffed review of this brief?</CardTitle>
          <CardDescription className="text-[#FFF7E9]/80">
            {save > 0
              ? `We already see AED ${save.toLocaleString()} in theoretical loaded-cost gap vs remote capacity — sanity-check assumptions in fifteen minutes.`
              : `Even without a flashy delta, nuanced payroll / visas / statutes deserve a sanity pass — fifteen minutes.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={wa}>WhatsApp · route to advisors</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-[#FFF7E9]/50 text-[#FFF7E9] hover:bg-white/10">
            <Link href={site.consultationUrl}>Book a 15-minute call</Link>
          </Button>
        </CardContent>
        <CardContent className="grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-75">Estimate</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-destructive">{formatAedCompact(detail.totalAnnual)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-75">Finanshels from</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-primary">{formatAedCompact(fin)}/yr</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-75">Δ vs floor</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">{formatAedCompact(save)}</p>
          </div>
        </CardContent>
      </Card>

      <button type="button" onClick={onRecalculate} className="mx-auto block text-xs font-semibold uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline">
        ← Recalculate with different assumptions
      </button>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Need the PDF dossier routed to advisers?</h3>
        <LeadCaptureForm
          toolSlug={TOOL_SLUG}
          calculatorInputs={{
            gate: gateProfile,
            summary: detail,
          }}
          calculatorOutputs={detail}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
        <NextTools tools={getNextRecommendedTools(TOOL_SLUG)} />
      </div>

      <PrintReport>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em]">Hiring posture · UAE</p>
          <p className="text-lg font-semibold">{gateProfile.companyName}</p>
          <Separator />
          <p className="text-sm">{formatAed(detail.totalAnnual)} annual employer load</p>
        </div>
      </PrintReport>

      <DisclaimerCard body="This flow optimises pipeline integrity — bespoke quotes require discovery. Not legal, visa, nor Emiratisation advice inside the tool shell." />
    </div>
  );
}
