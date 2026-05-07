import { clamp } from "@/lib/utils";
import { maturityBandFromScore } from "@/lib/scoring/maturity-band";

export type CashflowHealthInputs = {
  monthlyInflowAed: number;
  monthlyOutflowAed: number;
  receivablesOutstandingAed: number;
  averageCollectionDays: number;
  delayedCustomersCount: number;
  reserveBufferMonths: number;
  fixedMonthlyObligationsAed: number;
  customerConcentration: "healthy" | "moderate" | "high";
  runwayPressure:
    | "stable"
    | "tight_3_to_6m"
    | "critical_under_3m"
    | "growth_strained";
};

export function computeCashflowHealth(input: CashflowHealthInputs) {
  const net = input.monthlyInflowAed - input.monthlyOutflowAed;
  const runwayEstimateMonths = estimateRunwayMonths(net, input.reserveBufferMonths);

  const collectionStress = scoreCollectionStress(input.averageCollectionDays, input.delayedCustomersCount, input.receivablesOutstandingAed, input.monthlyInflowAed);

  const fixedPressure =
    input.monthlyOutflowAed > 0
      ? clamp01(input.fixedMonthlyObligationsAed / input.monthlyOutflowAed)
      : 0;
  const burnPressureScore = scoreBurnPressure(net, fixedPressure, input.reserveBufferMonths);

  const concentrationPenalty = concentrationScore(input.customerConcentration);
  const stability = avg([collectionStress, 100 - burnPressureScore / 2, concentrationPenalty]);

  const cashflowRaw = avg([
    clamp01(mapRunwayMonths(typeof runwayEstimateMonths === "number" && !Number.isFinite(runwayEstimateMonths) ? 0 : runwayEstimateMonths) * 100),
    collectionStress,
    concentrationPenalty,
    100 - burnPressureScore,
  ]);

  const cashflowScore = Math.round(Math.min(100, Math.max(0, cashflowRaw)));
  const bandMeta = maturityBandFromScore(cashflowScore);

  const suggestions = buildSuggestions(input, net);

  const collectionStressLevel =
    collectionStress >= 72 ? ("low" as const) : collectionStress >= 52 ? ("medium" as const) : ("high" as const);

  const runwayMonthsSafe =
    typeof runwayEstimateMonths === "number" && Number.isFinite(runwayEstimateMonths) ? runwayEstimateMonths : 0;
  const runwaySignalScore = Math.round(mapRunwayMonths(runwayMonthsSafe) * 100);
  const stabilityScore = Math.round(clamp(stability, 0, 100));
  const netFlowScore = Math.round(clamp(50 + Math.sign(net) * Math.min(45, Math.abs(net) / 80_000), 0, 100));

  return {
    cashflowScore,
    maturityLabel: bandMeta.label,
    maturityDescription: bandMeta.description,
    collectionStressLevel,
    runwayEstimateMonths: runwayEstimateMonths,
    burnPressureLabel: burnPressureScore >= 72 ? ("elevated" as const) : ("controlled" as const),
    stabilityIndicator:
      stability >= 68 ? ("resilient" as const) : stability >= 52 ? ("watch" as const) : ("fragile" as const),
    practicalSuggestions: suggestions,
    netMonthlyAed: Math.round(net),
    /** Normalized 0–100 dimensions aligned with the scoring engine (not hand-tuned chart heuristics). */
    chartDimensions: [
      { label: "Collections", value: Math.round(collectionStress) },
      { label: "Runway signal", value: runwaySignalScore },
      { label: "Stability", value: stabilityScore },
      { label: "Net cash bias", value: netFlowScore },
    ],
  };
}

function buildSuggestions(input: CashflowHealthInputs, net: number) {
  const tips: string[] = [];
  if (input.averageCollectionDays > 55) {
    tips.push("Tighten collections: weekly aging review, deposit milestones, and stop-work triggers for chronic late payers.");
  }
  if (input.delayedCustomersCount >= 3) {
    tips.push("Reduce delayed-customer cardinality — fewer, larger exposures often hide under 'it's only a few invoices'.");
  }
  if (input.customerConcentration !== "healthy") {
    tips.push("Concentration is a liquidity risk multiplier — diversify revenue pathways or secure safer payment terms.");
  }
  if (net < 0 && input.reserveBufferMonths < 4) {
    tips.push("Model a 90-day downside: delayable opex, founder draws, payroll flex, and receivable acceleration levers.");
  }
  tips.push(
    "Separate survival cash from strategic cash — know the minimum runway after non-negotiable obligations each month.",
  );
  return tips.slice(0, 4);
}

function scoreCollectionStress(days: number, delayedCustomers: number, ar: number, inflow: number) {
  const arLoad = inflow > 0 ? clamp01(ar / (inflow * 2)) : clamp01(ar / 250_000); // heuristic cap
  const dayScore =
    days <= 35 ? 88 : days <= 50 ? 72 : days <= 70 ? 55 : days <= 100 ? 40 : 28;
  const delayedPenalty = clamp01(delayedCustomers / 10) * 22;
  return clamp(dayScore - arLoad * 18 - delayedPenalty, 18, 95);
}

function scoreBurnPressure(net: number, fixedPressure: number, reserveMonths: number) {
  const netPain = net < 0 ? Math.min(60, Math.abs(net) / 50_000) : 10;
  const fixedPain = fixedPressure * 42;
  const reserveBoost = clamp(reserveMonths * 10, 0, 40);
  return clamp(netPain + fixedPain - reserveBoost, 0, 92);
}

function concentrationScore(c: CashflowHealthInputs["customerConcentration"]) {
  const map = { healthy: 86, moderate: 62, high: 42 } as const;
  return map[c];
}

function estimateRunwayMonths(net: number, reserveBufferMonths: number) {
  if (reserveBufferMonths < 0) return 0;
  if (net >= 0) return Math.round(Math.min(48, reserveBufferMonths + 6) * 10) / 10;
  /** When outflows exceed inflows we treat reserve months as stated runway (self-reported months of cover). */
  return Math.round(reserveBufferMonths * 10) / 10;
}

function mapRunwayMonths(m: number) {
  if (m <= 0) return 0.15;
  if (m < 3) return 0.35;
  if (m < 6) return 0.55;
  if (m < 12) return 0.72;
  return 0.9;
}

function clamp01(n: number) {
  return clamp(n, 0, 1);
}

function avg(vals: number[]) {
  return vals.reduce((s, v) => s + v, 0) / Math.max(vals.length, 1);
}
