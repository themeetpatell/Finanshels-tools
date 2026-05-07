import { describe, expect, it } from "vitest";

import {
  computeCorporateTaxDeadline,
  differenceInDaysCalendar,
  type CorporateTaxEstimatorInput,
} from "@/lib/scoring/corporate-tax-deadline";

describe("computeCorporateTaxDeadline", () => {
  const baseline: CorporateTaxEstimatorInput = {
    entityType: "mainland_llc",
    financialYearStart: "2025-04-01",
    financialYearEnd: "2026-03-31",
    registrationStatus: "registered",
    reminderPreference: "email",
  };

  it("adds configurable months to FY end for due date estimator", () => {
    const res = computeCorporateTaxDeadline(baseline, new Date(Date.UTC(2025, 0, 1)));
    expect(res.dueDateISO).toBe("2026-12-31");

    const now = new Date(Date.UTC(2026, 11, 1)); // Dec 1
    const lead = computeCorporateTaxDeadline(baseline, now);
    expect(lead.daysUntilDue).toBe(30);
    expect(lead.urgencyState).toBe("urgent"); // Within 45 days of illustrative due baseline
  });

  it("detects overdue scenarios relative to now", () => {
    const res = computeCorporateTaxDeadline(baseline, new Date(Date.UTC(2030, 0, 1)));
    expect(res.urgencyState).toBe("past_due_estimate");
    expect(res.daysUntilDue).toBeLessThan(0);
  });
});

describe("differenceInDaysCalendar", () => {
  it("measures UTC calendar deltas", () => {
    const a = new Date(Date.UTC(2026, 0, 1));
    const b = new Date(Date.UTC(2026, 5, 1));
    expect(differenceInDaysCalendar(b, a)).toBe(151);
  });
});
