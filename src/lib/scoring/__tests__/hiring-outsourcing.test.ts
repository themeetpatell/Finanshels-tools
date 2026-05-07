import { describe, expect, it } from "vitest";

import { computeHiringVsOutsourcing, type HiringBenchmarkInputs } from "@/lib/scoring/hiring-outsourcing";

const baseline: HiringBenchmarkInputs = {
  companyStage: "seed",
  industry: "saas",
  revenueBandId: "2m_10m",
  monthlyTransactionVolume: "medium",
  teamComplexity: "moderate",
  roles: ["accountant"],
  numberOfHiresByRole: { accountant: 1 },
  salaryMode: "preset_mid",
  benefitsOverheadPct: 18,
  visaOnboardingCostAed: 50_000,
  softwareToolingAnnualAed: 24_000,
  managementOverheadPct: 10,
  attritionReplacementBufferPct: 6,
  outsourcingMonthlyCostAed: 12_000,
  outsourcingUsesRecommendedBandMid: false,
};

describe("computeHiringVsOutsourcing", () => {
  it("computes directional annual totals with hidden loads", () => {
    const res = computeHiringVsOutsourcing(baseline);

    expect(res.totalAnnualInHouse).toBeGreaterThan(0);
    expect(res.hiddenOverheadsAnnual).toBeGreaterThan(0);
    expect(res.totalAnnualOutsourced).toBe(144_000); // AED 12k * 12
    expect(["in_house", "outsourced", "hybrid"]).toContain(res.recommendation);
  });

  it("honors outsource heuristic toggles without explicit AED retainer capture", () => {
    const res = computeHiringVsOutsourcing({
      ...baseline,
      outsourcingMonthlyCostAed: null,
      outsourcingUsesRecommendedBandMid: true,
    });

    expect(res.totalAnnualOutsourced).toBeGreaterThan(0);
  });
});
