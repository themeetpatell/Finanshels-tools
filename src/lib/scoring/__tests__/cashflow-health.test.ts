import { describe, expect, it } from "vitest";

import { computeCashflowHealth } from "@/lib/scoring/cashflow-health";

const baseInput = {
  monthlyInflowAed: 500_000,
  monthlyOutflowAed: 480_000,
  receivablesOutstandingAed: 200_000,
  averageCollectionDays: 45,
  delayedCustomersCount: 1,
  reserveBufferMonths: 6,
  fixedMonthlyObligationsAed: 200_000,
  customerConcentration: "moderate" as const,
  runwayPressure: "stable" as const,
};

describe("computeCashflowHealth", () => {
  it("returns chart dimensions aligned with the scoring engine", () => {
    const out = computeCashflowHealth(baseInput);
    expect(out.chartDimensions).toHaveLength(4);
    for (const row of out.chartDimensions) {
      expect(row.value).toBeGreaterThanOrEqual(0);
      expect(row.value).toBeLessThanOrEqual(100);
    }
  });
});
