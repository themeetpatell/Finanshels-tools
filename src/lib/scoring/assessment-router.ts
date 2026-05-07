import type { TrackId } from "@/lib/tools/tracks";
import type { ToolSlug } from "@/lib/tools/registry";

export type AssessmentAnswers = {
  businessType: "services" | "product" | "trading_distribution" | "holding_group" | "other";
  location: "mainland" | "free_zone";
  companyAgeMonths: number;
  annualRevenueBandId: string;
  employeeCount: number;
  vatRegistered: boolean;
  ctRegisteredKnown: boolean | null;
  accountingSoftwareStatus: "none" | "basic" | "erp_light" | "erp_mature";
  monthlyInvoiceVolume: "under_50" | "50_250" | "250_1500" | "1500_plus";
  biggestConcern:
    | "cashflow_pressure"
    | "compliance_deadlines"
    | "financial_visibility"
    | "pricing_margins"
    | "hiring_structure"
    | "scaling_controls";
  financeTeamSetup:
    | "founder_led"
    | "single_accountant"
    | "small_team"
    | "controller_grade"
    | "fractional_external";
  urgency:
    | "this_month"
    | "quarter"
    | "six_month_window"
    | "exploring";
};

export type AssessmentOutcome = {
  recommendedTrack: TrackId;
  maturitySnapshot: string;
  topTools: ToolSlug[];
  why: string;
};

/** Rule-based routing for MVP assessment — deterministic and editable. */
export function routeAssessment(answers: AssessmentAnswers): AssessmentOutcome {
  const track = deriveTrack(answers);
  const topTools = pickTools(track, answers);
  const maturitySnapshot = buildSnapshot(answers, track);

  const whyParts: string[] = [];
  whyParts.push(trackCopy(track));
  if (answers.biggestConcern !== "financial_visibility") {
    whyParts.push(`Your stated pressure point (${humanConcern(answers.biggestConcern)}) maps to tooling that converts intent into checkpoints.`);
  } else {
    whyParts.push("Visibility gaps typically compound across VAT, margins, and close discipline — sequencing tools reduces rework.");
  }
  if (!answers.ctRegisteredKnown) {
    whyParts.push("Corporate tax readiness is unresolved in your submission — prioritize compliance-timing clarity early.");
  }
  whyParts.push(locationNote(answers));

  return {
    recommendedTrack: track,
    maturitySnapshot,
    topTools,
    why: whyParts.join(" "),
  };
}

function deriveTrack(answers: AssessmentAnswers): TrackId {
  /** Concerns drive track first — revenue/team sharpen tool selection afterwards */
  if (answers.biggestConcern === "compliance_deadlines") return "stay_compliant";
  if (answers.biggestConcern === "cashflow_pressure" || answers.biggestConcern === "pricing_margins")
    return "stay_in_control";
  if (answers.biggestConcern === "hiring_structure") return "start_right";
  if (answers.biggestConcern === "scaling_controls" || answers.financeTeamSetup === "fractional_external")
    return "scale_smarter";

  /** Defaults by structural signals */
  if (!answers.ctRegisteredKnown || answers.location === "mainland") return "stay_compliant";
  if (
    answers.companyAgeMonths < 18 &&
    (answers.financeTeamSetup === "founder_led" || answers.financeTeamSetup === "single_accountant")
  ) {
    return "start_right";
  }
  if (answers.annualRevenueBandId === "10m_50m" || answers.annualRevenueBandId === "gt_50m") return "scale_smarter";
  return "stay_in_control";
}

function pickTools(track: TrackId, answers: AssessmentAnswers): ToolSlug[] {
  const concern = answers.biggestConcern;

  const baseByTrack: Record<TrackId, ToolSlug[]> = {
    start_right: [
      "hiring-vs-outsourcing-benchmark",
      "financial-health-checkup",
      "finance-maturity-score",
    ],
    stay_compliant: [
      "corporate-tax-deadline-checker",
      "financial-health-checkup",
      "finance-maturity-score",
    ],
    stay_in_control: [
      "cashflow-health-checkup",
      "financial-health-checkup",
      "finance-maturity-score",
    ],
    scale_smarter: [
      "finance-maturity-score",
      "cashflow-health-checkup",
      "hiring-vs-outsourcing-benchmark",
    ],
  };

  const seeded = [...baseByTrack[track]];
  /** Promote urgency-sensitive tools when concern demands */
  if (concern === "compliance_deadlines") {
    promote(seeded, "corporate-tax-deadline-checker");
  }
  if (concern === "cashflow_pressure") {
    promote(seeded, "cashflow-health-checkup");
  }
  if (concern === "hiring_structure") {
    promote(seeded, "hiring-vs-outsourcing-benchmark");
  }

  /** De-duplicate and cap 3 */
  return Array.from(new Set(seeded)).slice(0, 3);
}

function promote(list: ToolSlug[], slug: ToolSlug) {
  const idx = list.indexOf(slug);
  if (idx > 0) {
    list.splice(idx, 1);
    list.unshift(slug);
  }
}

function buildSnapshot(answers: AssessmentAnswers, track: TrackId) {
  const revenue = answers.annualRevenueBandId.replaceAll("_", " ");
  const team = answers.financeTeamSetup.replaceAll("_", " ");
  const control =
    answers.accountingSoftwareStatus === "none"
      ? "books are brittle"
      : answers.accountingSoftwareStatus === "erp_mature"
        ? "systems are materially stronger than typical peers at this band"
        : "systems exist but maturity varies month to month";

  return `UAE ${answers.location === "free_zone" ? "free-zone" : "mainland"} operator · ~${answers.employeeCount} employees · ${revenue.replace("gt ", "greater than ").replace("lt ", "less than ")} AED revenue band · finance run as ${team} · ${control} — routed into ${TRACK_LABEL_LOOKUP[track]}.`;
}

const TRACK_LABEL_LOOKUP: Record<TrackId, string> = {
  start_right: "Start Right",
  stay_compliant: "Stay Compliant",
  stay_in_control: "Stay in Control",
  scale_smarter: "Scale Smarter",
};

function trackCopy(track: TrackId) {
  switch (track) {
    case "start_right":
      return "You are aligning operating model fundamentals before layering complexity.";
    case "stay_compliant":
      return "Your sequence should reduce regulatory surprise cost before chasing optimization.";
    case "stay_in_control":
      return "Your near-term ROI is tighter cash posture and truthful monthly reporting.";
    case "scale_smarter":
      return "You should convert finance into a scaling system — KPI truth, rhythms, governance.";
    default:
      return "";
  }
}

function humanConcern(c: AssessmentAnswers["biggestConcern"]) {
  const map = {
    cashflow_pressure: "cashflow pressure",
    compliance_deadlines: "deadline risk",
    financial_visibility: "visibility gaps",
    pricing_margins: "margin pressure",
    hiring_structure: "team design",
    scaling_controls: "control and scalability",
  } as const satisfies Record<AssessmentAnswers["biggestConcern"], string>;

  return map[c];
}

function locationNote(a: AssessmentAnswers) {
  if (a.location === "free_zone") return "Free zone structuring does not imply compliance autopilot — map filings and substance carefully.";
  return "Mainland operations usually demand tighter bookkeeping cadence alongside VAT discipline.";
}
