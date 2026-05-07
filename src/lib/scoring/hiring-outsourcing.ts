import type { RoleBenchmarkKey } from "@/lib/config/benchmarks";
import { ROLE_SALARY_BENCHMARKS_AED } from "@/lib/config/benchmarks";

export type HiringBenchmarkInputs = {
  companyStage: "pre_seed" | "seed" | "series_a" | "growth" | "enterprise";
  industry: "saas" | "services" | "trading_distribution" | "other";
  revenueBandId: string;
  monthlyTransactionVolume: "low" | "medium" | "high";
  teamComplexity: "simple" | "moderate" | "complex";

  roles: RoleBenchmarkKey[];
  numberOfHiresByRole: Partial<Record<RoleBenchmarkKey, number>>;

  salaryMode: "preset_mid" | "custom";
  customMonthlySalaryAed?: number;

  benefitsOverheadPct: number; // 0-35
  visaOnboardingCostAed: number; // annualized simplified
  softwareToolingAnnualAed: number;
  managementOverheadPct: number; // 0-35
  attritionReplacementBufferPct: number; // 0-25

  outsourcingMonthlyCostAed: number | null;
  outsourcingUsesRecommendedBandMid: boolean;
};

export type HiringRecommendation = "in_house" | "outsourced" | "hybrid";

export function computeHiringVsOutsourcing(input: HiringBenchmarkInputs) {
  const loadedMonthlySalaryPerSeat = computeMonthlySalarySeat(input);

  const totalAnnualBase = input.roles.reduce((sum, role) => {
    const count = clampInt(input.numberOfHiresByRole[role] ?? 0, 0, 25);
    if (count === 0) return sum;
    return sum + loadedMonthlySalaryPerSeat(role) * 12 * count;
  }, 0);

  const headcount = input.roles.reduce(
    (sum, role) => sum + clampInt(input.numberOfHiresByRole[role] ?? 0, 0, 25),
    0,
  );

  const benefitsLoad = totalAnnualBase * clampPct(input.benefitsOverheadPct);
  const managementLoad = (totalAnnualBase + benefitsLoad) * clampPct(input.managementOverheadPct);
  const attritionLoad = (totalAnnualBase + benefitsLoad) * clampPct(input.attritionReplacementBufferPct);

  const hiddenOverheadsAnnual = benefitsLoad + managementLoad + attritionLoad + input.visaOnboardingCostAed + input.softwareToolingAnnualAed;

  const inHouseAnnual = totalAnnualBase + hiddenOverheadsAnnual;

  let outsourcedAnnual: number | null = null;
  let outsourcingNote =
    input.outsourcingUsesRecommendedBandMid
      ? "Outsourced cost uses your entered estimate at the midpoint of the comparison."
      : "Outsourced cost uses your explicitly entered monthly retainer/package estimate.";

  if (input.outsourcingMonthlyCostAed != null && input.outsourcingMonthlyCostAed > 0) {
    outsourcedAnnual = input.outsourcingMonthlyCostAed * 12;
  }

  /** If outsourced not provided but preset mode flagged, approximate from stage + complexity when user didn't enter */
  if (outsourcedAnnual == null && input.outsourcingUsesRecommendedBandMid) {
    const bandMid = heuristicOutsourceMonthly(input.companyStage, input.teamComplexity, loadedMonthlySalaryPerSeat, headcount);
    outsourcedAnnual = bandMid * 12;
    outsourcingNote =
      "Outsourced baseline is a heuristic midpoint from stage + workload — replace with Finanshels quote for fidelity.";
  }

  if (outsourcedAnnual == null) {
    outsourcedAnnual = heuristicOutsourceMonthly(input.companyStage, input.teamComplexity, loadedMonthlySalaryPerSeat, Math.max(headcount, 1)) * 12;
    outsourcingNote = "Estimated outsourced baseline generated because no monthly cost was supplied — tune inputs.";
  }

  const diffAnnual = Math.round(inHouseAnnual - outsourcedAnnual);
  const diffMonthly = Math.round(diffAnnual / 12);

  const recommendation = pickRecommendation(diffAnnual, headcount, input.teamComplexity, input.companyStage);

  const sensitivityNote =
    "Costs swing with visa multiples, onboarding churn, recruiter fees, ERP stack, audit load, and group reporting — treat output as directional.";

  return {
    effectiveMonthlyInHouse: Math.round(inHouseAnnual / 12),
    effectiveMonthlyOutsourced: Math.round(outsourcedAnnual / 12),
    totalAnnualInHouse: Math.round(inHouseAnnual),
    totalAnnualOutsourced: Math.round(outsourcedAnnual),
    hiddenOverheadsAnnual: Math.round(hiddenOverheadsAnnual),
    costDifferenceAnnual: diffAnnual,
    costDifferenceMonthly: diffMonthly,
    recommendation,
    outsourcingNote,
    sensitivityNote,
    headcount,
  };
}

function computeMonthlySalarySeat(input: HiringBenchmarkInputs): (role: RoleBenchmarkKey) => number {
  return (role) => {
    const bench = ROLE_SALARY_BENCHMARKS_AED[role];
    if (input.salaryMode === "custom" && typeof input.customMonthlySalaryAed === "number") {
      return Math.max(0, input.customMonthlySalaryAed);
    }
    const industryAdj =
      input.industry === "saas" ? 1.05 : input.industry === "services" ? 0.98 : input.industry === "trading_distribution" ? 1.02 : 1;
    return Math.round(bench.monthlyMid * industryAdj);
  };
}

function heuristicOutsourceMonthly(
  stage: HiringBenchmarkInputs["companyStage"],
  complexity: HiringBenchmarkInputs["teamComplexity"],
  seatSalary: (role: RoleBenchmarkKey) => number,
  headcount: number,
) {
  const blendedSeat = avgSeatSalaryFallback(seatSalary);
  const base =
    complexity === "simple" ? blendedSeat * 0.42 : complexity === "moderate" ? blendedSeat * 0.62 : blendedSeat * 0.82;
  const stageMult =
    stage === "pre_seed" ? 0.85 : stage === "seed" ? 0.95 : stage === "series_a" ? 1.05 : stage === "growth" ? 1.12 : 1.22;
  return Math.round(base * Math.max(1, headcount) ** 0.82 * stageMult);
}

function avgSeatSalaryFallback(seatSalary: (role: RoleBenchmarkKey) => number) {
  const keys = Object.keys(ROLE_SALARY_BENCHMARKS_AED) as RoleBenchmarkKey[];
  const vals = keys.map((k) => seatSalary(k));
  const mid = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] ?? seatSalary("accountant");
  return mid;
}

function pickRecommendation(diffAnnual: number, headcount: number, complexity: HiringBenchmarkInputs["teamComplexity"], stage: HiringBenchmarkInputs["companyStage"]): HiringRecommendation {
  /** Positive diffAnnual => in-house more expensive vs outsourced estimator */
  if (headcount === 0) return "outsourced";

  const hybridBias =
    complexity === "complex" || stage === "growth" || stage === "enterprise";

  /** Large savings favor outsource; materially cheaper internal favors in-house unless hybridBias */
  if (diffAnnual > 65000 && (headcount <= 5 || hybridBias)) return hybridBias ? "hybrid" : "outsourced";
  if (diffAnnual > 110000 && headcount >= 6) return "outsourced";

  if (diffAnnual < -95000 && headcount >= 4 && complexity !== "complex") return "in_house";
  if (diffAnnual < -65000 && headcount >= 5) return hybridBias ? "hybrid" : "in_house";

  return hybridBias ? "hybrid" : "outsourced";
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n)) / 100;
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : 0)));
}
