"use client";

import { format, parseISO } from "date-fns";
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

import { LabeledSlot } from "@/components/forms/labeled-slot";
import { NextTools } from "@/components/results/next-tools";
import { PrintReport } from "@/components/results/print-report";
import { LeadCaptureForm } from "@/components/lead/lead-capture-form";
import { DisclaimerCard } from "@/components/tools/disclaimer-card";
import { StickyMobileCta } from "@/components/tools/sticky-mobile-cta";
import { CtaRow } from "@/components/tools/cta-row";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { WorkflowStatusLine } from "@/components/tools/workflow-status-line";

import { computeCorporateTaxDeadline, type CorporateTaxEstimatorInput } from "@/lib/scoring/corporate-tax-deadline";
import { getFirstErrorMessage } from "@/lib/forms/first-error";
import { UAE_RULES } from "@/lib/config/uaeRules";
import { getNextRecommendedTools } from "@/lib/tools/recommendations";
import { trackEvent } from "@/lib/analytics/track";
import { useAnonymousToken } from "@/hooks/use-anonymous-id";

const schema = z.object({
  entityType: z.enum(["mainland_llc", "fz_branch", "fz_holding", "other_group_entity"]),
  financialYearStart: z.string().min(10).max(10),
  financialYearEnd: z.string().min(10).max(10),
  registrationStatus: z.enum(["registered", "in_progress", "not_started", "unknown"]),
  reminderPreference: z.enum(["email", "sms", "teams_or_slack", "no_preference"]),
});

const TOOL_SLUG = "corporate-tax-deadline-checker";

const URGENCY_BADGE: Record<string, string> = {
  past_due_estimate: "Past due estimate",
  critical: "Critical window",
  urgent: "Approaching cutoff",
  watch: "Plan now",
  ok: "Comfortable runway",
};

export function CorporateTaxDeadlineClient() {
  const token = useAnonymousToken();
  const [submitted, setSubmitted] = useState(false);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      entityType: "mainland_llc",
      financialYearStart: "2025-04-01",
      financialYearEnd: "2026-03-31",
      registrationStatus: "registered",
      reminderPreference: "email",
    },
    mode: "onChange",
  });

  useEffect(() => {
    trackEvent("tool_started", { toolSlug: TOOL_SLUG });
  }, []);

  const computed = submitted ? computeCorporateTaxDeadline(form.getValues() as CorporateTaxEstimatorInput) : null;

  async function onSubmit(vals: z.infer<typeof schema>) {
    const outputs = computeCorporateTaxDeadline(vals as CorporateTaxEstimatorInput);
    trackEvent("tool_completed", { toolSlug: TOOL_SLUG, urgencyState: outputs.urgencyState });
    setSubmitted(true);

    fetch("/api/tool-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolSlug: TOOL_SLUG,
        anonymousToken: token ?? undefined,
        inputs: vals,
        outputs,
      }),
    }).catch(() => undefined);
  }

  const firstErr = getFirstErrorMessage(form.formState.errors);

  return (
    <div className="space-y-8 pb-24 md:pb-10">
      <div className="space-y-3">
        <ToolPageHeader slug={TOOL_SLUG} />
        <DisclaimerCard title="Mandatory legal disclaimer" body={UAE_RULES.corporateTax.disclaimer} />
      </div>

      <WorkflowStatusLine
        phase={submitted ? "results" : "inputs"}
        detail={`Rule offset is FY end + ${UAE_RULES.corporateTax.filingDueMonthsAfterFinancialYearEnd} months (configurable in uaeRules).`}
      />

      {!submitted ? (
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entity timeline inputs</CardTitle>
              <CardDescription>Dates captured as UAE calendar context — informational estimator only.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <LabeledSlot label="Entity architecture">
                <Select
                  value={form.watch("entityType")}
                  onValueChange={(v) =>
                    form.setValue("entityType", v as CorporateTaxEstimatorInput["entityType"], { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainland_llc">Mainland LLC</SelectItem>
                    <SelectItem value="fz_branch">Free zone branch / extension</SelectItem>
                    <SelectItem value="fz_holding">Free zone holding / group structure</SelectItem>
                    <SelectItem value="other_group_entity">Other grouped / unconventional structure</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Corporate tax registration status (self-declared)">
                <Select
                  value={form.watch("registrationStatus")}
                  onValueChange={(v) =>
                    form.setValue("registrationStatus", v as CorporateTaxEstimatorInput["registrationStatus"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered pathway underway / complete</SelectItem>
                    <SelectItem value="in_progress">Assessment with advisers</SelectItem>
                    <SelectItem value="not_started">No meaningful start yet</SelectItem>
                    <SelectItem value="unknown">Unclear internally</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>

              <LabeledSlot label="Financial year start (YYYY-MM-DD)">
                <Input type="date" {...form.register("financialYearStart")} />
              </LabeledSlot>

              <LabeledSlot label="Financial year end (YYYY-MM-DD)">
                <Input type="date" {...form.register("financialYearEnd")} />
              </LabeledSlot>

              <LabeledSlot label="Reminder preference">
                <Select
                  value={form.watch("reminderPreference")}
                  onValueChange={(v) =>
                    form.setValue("reminderPreference", v as CorporateTaxEstimatorInput["reminderPreference"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email nudges</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="teams_or_slack">Teams / Slack pings</SelectItem>
                    <SelectItem value="no_preference">No preference</SelectItem>
                  </SelectContent>
                </Select>
              </LabeledSlot>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button size="lg" type="submit">
              Estimate filings timeline
            </Button>
          </div>

          {firstErr ? (
            <p role="alert" className="text-sm text-destructive">
              {firstErr}
            </p>
          ) : null}
        </form>
      ) : (
        <Card className="border-primary/25 bg-gradient-to-br from-card via-background to-background">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Badge variant={computed?.urgencyState === "ok" ? "outline" : "destructive"}>
                {URGENCY_BADGE[computed?.urgencyState ?? "watch"] ?? "Watch"}
              </Badge>
              <Badge variant="secondary">Due ISO {computed?.dueDateISO ?? "–"}</Badge>
              <Badge variant="secondary">
                Styled due date {computed?.dueDateISO ? safeFormat(parseISO(computed.dueDateISO)) : "–"}
              </Badge>
              <Badge variant="secondary">Configurator v{UAE_RULES.meta.schemaVersion}</Badge>
            </div>
            <CardTitle>Filing estimator output</CardTitle>
            <CardDescription className="text-base">{computed?.disclaimer}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assumed filings due</p>
                <p className="mt-3 text-xl font-semibold">{computed?.dueDateISO ?? "–"}</p>
                <p className="text-sm text-muted-foreground">
                  Derived as FY end + {UAE_RULES.corporateTax.filingDueMonthsAfterFinancialYearEnd} months (editable constant).
                </p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Days until indicative due</p>
                <p className="mt-3 text-xl font-semibold">{computed?.daysUntilDue ?? "–"} days</p>
                <p className="text-sm text-muted-foreground">Calendar-day delta for planning — validate with filings calendar owner.</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Next milestone</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{computed?.nextRecommendedAction}</p>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Compliance notes</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {computed?.complianceNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{computed?.entityNote}</p>
            </section>

            <CtaRow
              prominent
              toolSlug={TOOL_SLUG}
              whatsappMessage="Hi Finanshels — used the corporate tax estimator. Need filings timeline validation."
            />

            <PrintReport>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Corporate tax estimator snapshot</p>
                <h2 className="text-xl font-semibold">Assumed filings due on {computed?.dueDateISO}</h2>
                <p className="text-sm text-muted-foreground break-words">{computed?.disclaimer}</p>
                <Separator />
                <pre className="whitespace-pre-wrap text-xs">{computed?.nextRecommendedAction}</pre>
              </div>
            </PrintReport>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight">Next recommended tools</h3>
              <NextTools tools={getNextRecommendedTools(TOOL_SLUG)} />
            </div>

            <LeadCaptureForm toolSlug={TOOL_SLUG} calculatorInputs={form.getValues()} calculatorOutputs={computed ?? {}} />

            <DisclaimerCard body="Reminder preference captured here informs Finanshels follow-up choreography only — confirm regulatory obligations independently." />
          </CardContent>
        </Card>
      )}

      <StickyMobileCta
        toolSlug={TOOL_SLUG}
        whatsappMessage="Hi Finanshels — corporate tax estimator output attached mentally — need escalation path."
      />
    </div>
  );
}

function safeFormat(date: Date) {
  try {
    return format(date, "d MMMM yyyy");
  } catch {
    return "invalid date";
  }
}
