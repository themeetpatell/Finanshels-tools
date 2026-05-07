import { describe, expect, it } from "vitest";

import { computeDetailedEmployerCost, defaultStatutoryFromSalary } from "@/lib/scoring/hiring-employer-detail";

describe("hiring-employer-detail", () => {
  it("derives UAE-shaped statutory anchors from wage", () => {
    const m = defaultStatutoryFromSalary(11000);
    expect(m.annualLeaveProvisionAed).toBeGreaterThan(0);
    expect(m.gratuityYear1AccrualAed).toBeGreaterThan(0);
    expect(m.noticePeriodBufferAed).toBe(11000);
  });

  it("totals line items consistently", () => {
    const r = computeDetailedEmployerCost({
      roleKey: "accountant",
      expectedMonthlySalaryAed: 11000,
      visaMedicalInsuranceAed: 12000,
      workspace: "hybrid",
      officeLocationLabel: "Business Bay",
      monthlyDeskCostAed: 2200,
      softwareAnnualAed: 1800,
      hardwareOneOffAed: 8000,
      hardwareAmortYears: 3,
      managementHoursPerWeek: 5,
      managementHourlyRateAed: 500,
    });

    expect(r.totalAnnual).toBeGreaterThan(r.lines[0]?.annualAed ?? 0);
    expect(r.monthlyTotal).toBeGreaterThan(0);
    expect(r.estimatedSavingVsFinanshels).toBeGreaterThan(0);
    expect(r.peers.some((p) => p.yours)).toBe(true);
  });

  it("zeros office when remote", () => {
    const r = computeDetailedEmployerCost({
      roleKey: "accountant",
      expectedMonthlySalaryAed: 10000,
      visaMedicalInsuranceAed: 0,
      workspace: "fully_remote",
      officeLocationLabel: "Remote",
      monthlyDeskCostAed: 5000,
      softwareAnnualAed: 0,
      hardwareOneOffAed: 0,
      hardwareAmortYears: 3,
      managementHoursPerWeek: 0,
      managementHourlyRateAed: 500,
    });
    const office = r.lines.find((l) => l.id === "office");
    expect(office?.annualAed).toBe(0);
  });
});
