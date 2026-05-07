import { maturityBandFromScore } from "@/lib/scoring/maturity-band";

export type FinancialHealthInputs = {
  monthlyRevenueAed: number;
  monthlyExpensesAed: number;
  profitMarginBand: "negative" | "0_5" | "5_15" | "15_30" | "30_plus";
  cashReserveMonths: number;
  receivableCollectionDays: number;
  bookkeepingTimeliness: "delayed" | "within_15" | "within_7" | "realtime";
  reportingFrequency: "ad_hoc" | "quarterly" | "monthly" | "weekly";
  vatReadiness: "low" | "medium" | "high";
  ctReadiness: "low" | "medium" | "high";
  founderDependency: "total" | "high" | "medium" | "low";
};

export function computeFinancialHealth(input: FinancialHealthInputs) {
  const marginScore = scoreMarginBand(input.profitMarginBand);
  const reserveScore = scoreReserves(input.monthlyRevenueAed, input.monthlyExpensesAed, input.cashReserveMonths);
  const processDiscipline = avg([
    scoreBookkeepingTimeliness(input.bookkeepingTimeliness),
    scoreReportingFrequency(input.reportingFrequency),
    scoreCollectionCycle(input.receivableCollectionDays),
  ]);
  const taxReadiness = avg([scoreTriState(input.vatReadiness), scoreTriState(input.ctReadiness)]);
  const dependencyPenalty = scoreFounderDependency(input.founderDependency); // higher is better posture

  /** Headline health aggregates the pillars */
  const healthRaw = avg([marginScore, reserveScore, processDiscipline, taxReadiness, dependencyPenalty]);
  const health = Math.round(Math.min(100, Math.max(0, healthRaw)));

  const bandMeta = maturityBandFromScore(health);

  const topIssues: string[] = [];
  if (marginScore < 55) topIssues.push("Margin structure is compressing decision quality — pricing, COGS, or mix needs a hard review.");
  if (reserveScore < 55) topIssues.push("Liquidity buffer vs burn is tight — stress-test a downside month and funding path.");
  if (processDiscipline < 60) topIssues.push("Close hygiene and reporting rhythm are inconsistent — numbers arrive too late to steer.");
  if (taxReadiness < 60) topIssues.push("Tax readiness is not board-defensible — filings risk and surprise costs are elevated.");
  if (dependencyPenalty < 60) topIssues.push("Founder dependency concentrates risk — approvals, payables, and reporting live in one brain.");

  const nextSteps = [
    "Build a single monthly management pack: revenue, gross margin bridge, cash waterfall, and debtor aging.",
    marginScore < reserveScore
      ? "Run a 90-day margin recovery sprint: top 5 customers, top 5 vendors, and SKU/service line profitability reality check."
      : "Lock a minimum cash reserve policy expressed in months — not vibes.",
    taxReadiness < 70
      ? "Produce a filings calendar owned by finance with document checklist and agency/advisor RACI."
      : "Add a lightweight forecast vs actual rhythm with owner and weekly cash check-ins.",
  ];

  return {
    healthScore: health,
    maturityLabel: bandMeta.label,
    maturityDescription: bandMeta.description,
    marginStrength: Math.round(marginScore),
    reserveStrength: Math.round(reserveScore),
    processDiscipline: Math.round(processDiscipline),
    taxReadiness: Math.round(taxReadiness),
    founderDependencyRisk: Math.round(100 - dependencyPenalty),
    topIssues: topIssues.slice(0, 3),
    nextSteps,
  };
}

function avg(vals: number[]) {
  return vals.reduce((s, v) => s + v, 0) / Math.max(vals.length, 1);
}

function scoreMarginBand(band: FinancialHealthInputs["profitMarginBand"]) {
  const map = { negative: 15, "0_5": 35, "5_15": 55, "15_30": 75, "30_plus": 92 } as const;
  return map[band];
}

function scoreBookkeepingTimeliness(v: FinancialHealthInputs["bookkeepingTimeliness"]) {
  const map = { delayed: 35, within_15: 60, within_7: 78, realtime: 92 } as const;
  return map[v];
}

function scoreReportingFrequency(v: FinancialHealthInputs["reportingFrequency"]) {
  const map = { ad_hoc: 30, quarterly: 50, monthly: 72, weekly: 90 } as const;
  return map[v];
}

function scoreTriState(v: "low" | "medium" | "high") {
  const map = { low: 35, medium: 62, high: 88 } as const;
  return map[v];
}

function scoreFounderDependency(v: FinancialHealthInputs["founderDependency"]) {
  /** Higher score means less unhealthy dependency */
  const map = { total: 25, high: 45, medium: 68, low: 90 } as const;
  return map[v];
}

function scoreCollectionCycle(days: number) {
  if (days <= 35) return 90;
  if (days <= 55) return 72;
  if (days <= 80) return 55;
  return 38;
}

function scoreReserves(revenue: number, expenses: number, monthsReserve: number) {
  const burnHint = Math.max(expenses - revenue, 0);
  const runwayLike = burnHint <= 0 ? monthsReserve + 3 : monthsReserve; // profitability lifts score baseline
  if (runwayLike >= 6) return 92;
  if (runwayLike >= 4) return 78;
  if (runwayLike >= 2) return 60;
  if (runwayLike >= 1) return 45;
  return 28;
}
