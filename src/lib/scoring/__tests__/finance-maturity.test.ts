import { describe, expect, it } from "vitest";

import { computeFinanceMaturity } from "@/lib/scoring/finance-maturity";

describe("computeFinanceMaturity", () => {
  it("returns scale-ready band for uniformly strong posture", () => {
    const res = computeFinanceMaturity({
      compliancePosture: 3,
      vatGovernance: 3,
      ctReadinessArtifacts: 3,
      cashForecastHorizonWeeks: 3,
      debtorControl: 3,
      apDiscipline: 3,
      monthEndCloseCadence: 3,
      policyControlEnvironment: 3,
      managementReportingQuality: 3,
      boardInvestorReporting: 3,
      teamStructureCoverage: 3,
    });

    expect(res.overall).toBeGreaterThanOrEqual(80);
    expect(res.band).toBe("scale-ready");
    expect(Object.values(res.dimensions).every((v) => v >= 95)).toBe(true);
  });

  it("surfaces weakest dimensions in top risks", () => {
    const res = computeFinanceMaturity({
      compliancePosture: 3,
      vatGovernance: 3,
      ctReadinessArtifacts: 3,
      cashForecastHorizonWeeks: 0,
      debtorControl: 0,
      apDiscipline: 0,
      monthEndCloseCadence: 3,
      policyControlEnvironment: 3,
      managementReportingQuality: 3,
      boardInvestorReporting: 3,
      teamStructureCoverage: 3,
    });

    const titles = res.topRisks.map((r) => r.dimension);
    expect(titles[0]).toBe("cashflow");
  });
});
