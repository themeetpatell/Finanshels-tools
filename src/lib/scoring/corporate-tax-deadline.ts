import { addMonths } from "date-fns";
import { UAE_RULES } from "@/lib/config/uaeRules";

export type CorporateTaxEstimatorInput = {
  entityType:
    | "mainland_llc"
    | "fz_branch"
    | "fz_holding"
    | "other_group_entity";
  /** ISO date yyyy-mm-dd */
  financialYearStart: string;
  financialYearEnd: string;
  registrationStatus:
    | "registered"
    | "in_progress"
    | "not_started"
    | "unknown";
  reminderPreference:
    | "email"
    | "sms"
    | "teams_or_slack"
    | "no_preference";
};

export type UrgencyState = "past_due_estimate" | "critical" | "urgent" | "watch" | "ok";

export function computeCorporateTaxDeadline(input: CorporateTaxEstimatorInput, now = new Date()) {
  const fyEnd = parseISODateOnly(input.financialYearEnd);
  const months = UAE_RULES.corporateTax.filingDueMonthsAfterFinancialYearEnd;
  const due = addMonths(fyEnd, months);

  const daysUntilDue = differenceInDaysCalendar(due, now);
  let urgency: UrgencyState = "ok";

  if (daysUntilDue < 0) urgency = "past_due_estimate";
  else if (daysUntilDue <= UAE_RULES.corporateTax.criticalWithinDays) urgency = "critical";
  else if (daysUntilDue <= UAE_RULES.corporateTax.urgentWithinDays) urgency = "urgent";
  else if (daysUntilDue <= 120) urgency = "watch";

  const complianceNotes: string[] = [];
  complianceNotes.push(
    `Estimated filing baseline: FY end + ${months} months (${UAE_RULES.meta.jurisdictionNote})`,
  );
  complianceNotes.push(
    input.registrationStatus === "registered"
      ? "Entity registration posture appears progressed — validate assessment periods and exemptions with your advisor."
      : "Registration posture is unclear or incomplete in your submission — reconcile status before relying on timelines.",
  );
  complianceNotes.push(
    "Free zone / group structures can materially change applicability — estimator cannot capture entity-specific facts.",
  );

  const nextRecommendedAction =
    urgency === "past_due_estimate"
      ? "Treat dates as overdue until an advisor validates your assessment year and filings position."
      : urgency === "critical" || urgency === "urgent"
        ? "Lock a filings workplan now: finalize trial balance, TP/local file needs, payments calendar, and responsible owners."
        : "Schedule a reconciliation checkpoint: tie accounts to filings assumptions and confirm adviser sign-off checkpoints.";

  return {
    dueDateISO: formatISODateOnly(due),
    daysUntilDue,
    urgencyState: urgency,
    complianceNotes,
    nextRecommendedAction,
    paymentModeledSameAsFiling: UAE_RULES.corporateTax.paymentDueSameAsFiling,
    disclaimer: UAE_RULES.corporateTax.disclaimer,
    entityNote: describeEntity(input.entityType),
    reminderPreference: input.reminderPreference,
  };
}

export function describeEntity(entityType: CorporateTaxEstimatorInput["entityType"]) {
  switch (entityType) {
    case "mainland_llc":
      return "Mainland LLC timelines are modeled with the generic FY-end offset — confirm elective / actual year-end specifics.";
    case "fz_branch":
      return "Free zone branch structuring can introduce allocation complexity — timelines may shift with filings elections.";
    case "fz_holding":
      return "Holding and group structuring require substance and documentation discipline — do not rely on this estimator alone.";
    default:
      return "Group or non-standard structures need bespoke mapping — use this output as a discussion baseline only.";
  }
}

function parseISODateOnly(iso: string) {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  if (!y || !m || !d) throw new Error("Invalid date format, expected YYYY-MM-DD");
  return new Date(Date.UTC(y, m - 1, d));
}

function formatISODateOnly(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Calendar day difference in UTC (stable for unit tests) */
export function differenceInDaysCalendar(later: Date, earlier: Date) {
  const ms = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  const es = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate());
  return Math.round((ms - es) / 86400000);
}
