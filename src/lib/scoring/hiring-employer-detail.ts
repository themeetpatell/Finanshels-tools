import type { RoleBenchmarkKey } from "@/lib/config/benchmarks";
import { ROLE_SALARY_BENCHMARKS_AED } from "@/lib/config/benchmarks";

export type WorkspaceArrangement = "full_office" | "hybrid" | "fully_remote";

export type SoftwareSkuId = "xero" | "quickbooks" | "zoho" | "tally" | "sap_oracle" | "unsure";

export type DetailedEmployerInput = {
  roleKey: RoleBenchmarkKey;
  expectedMonthlySalaryAed: number;
  visaMedicalInsuranceAed: number;
  /** Optional overrides — defaults derived from wage */
  annualLeaveProvisionAed?: number;
  gratuityYear1AccrualAed?: number;
  noticePeriodBufferAed?: number;
  workspace: WorkspaceArrangement;
  officeLocationLabel: string;
  monthlyDeskCostAed: number;
  /** Annual software total from selected SKUs */
  softwareAnnualAed: number;
  /** One-off hardware; amortized over years */
  hardwareOneOffAed: number;
  hardwareAmortYears: number;
  managementHoursPerWeek: number;
  /** Founder / exec time cost */
  managementHourlyRateAed: number;
};

export type CostBreakdownLine = {
  id: string;
  label: string;
  annualAed: number;
  /** UI colour key */
  tone: "salary" | "visa" | "statutory" | "office" | "software" | "hardware" | "time" | "other";
};

export type PeerBand = {
  label: string;
  annualAed: number;
  hint: string;
  typical?: boolean;
  yours?: boolean;
};

export function defaultStatutoryFromSalary(monthlySalaryAed: number) {
  const annual = monthlySalaryAed * 12;
  const daily = annual / 365;
  return {
    annualLeaveProvisionAed: Math.round(daily * 30),
    gratuityYear1AccrualAed: Math.round(daily * 21),
    noticePeriodBufferAed: Math.round(monthlySalaryAed),
  };
}

function deskMultiplier(workspace: WorkspaceArrangement) {
  if (workspace === "full_office") return 1;
  if (workspace === "hybrid") return 0.6;
  return 0;
}

export const SOFTWARE_SKU_MONTHLY_AED: Record<SoftwareSkuId, number> = {
  xero: 150,
  quickbooks: 120,
  zoho: 80,
  tally: 60,
  sap_oracle: 800,
  unsure: 0,
};

export function sumSoftwareAnnual(selected: SoftwareSkuId[]) {
  const months = selected.reduce((s, id) => s + SOFTWARE_SKU_MONTHLY_AED[id], 0);
  return months * 12;
}

/** Finanshels illustrative floor for comparison table (AED / year) */
export const FINANSHELS_REMOTE_ACCOUNTANT_FROM_ANNUAL_AED = 30_000;

export function computeDetailedEmployerCost(input: DetailedEmployerInput) {
  const bench = ROLE_SALARY_BENCHMARKS_AED[input.roleKey];
  const monthly = Math.max(0, input.expectedMonthlySalaryAed);
  const annualSalary = Math.round(monthly * 12);

  const defaults = defaultStatutoryFromSalary(monthly);
  const leave = input.annualLeaveProvisionAed ?? defaults.annualLeaveProvisionAed;
  const gratuity = input.gratuityYear1AccrualAed ?? defaults.gratuityYear1AccrualAed;
  const notice = input.noticePeriodBufferAed ?? defaults.noticePeriodBufferAed;

  const deskMult = deskMultiplier(input.workspace);
  const officeAnnual = Math.round(Math.max(0, input.monthlyDeskCostAed) * 12 * deskMult);

  const softwareAnnual = Math.max(0, input.softwareAnnualAed);
  const amortYears = Math.max(1, input.hardwareAmortYears);
  const hardwareAnnual = Math.round(Math.max(0, input.hardwareOneOffAed) / amortYears);

  const hours = Math.min(60, Math.max(0, input.managementHoursPerWeek));
  const rate = Math.max(0, input.managementHourlyRateAed);
  const managementTimeAnnual = Math.round(hours * 52 * rate);

  const visa = Math.max(0, input.visaMedicalInsuranceAed);

  const lines: CostBreakdownLine[] = [
    { id: "salary", label: "Base salary (annual)", annualAed: annualSalary, tone: "salary" },
    { id: "visa", label: "Visa, Emirates ID & medical (year-one load)", annualAed: visa, tone: "visa" },
    { id: "leave", label: "Annual leave provision", annualAed: leave, tone: "statutory" },
    { id: "gratuity", label: "Gratuity accrual (year-one basis)", annualAed: gratuity, tone: "statutory" },
    { id: "notice", label: "Notice period / EOS buffer", annualAed: notice, tone: "statutory" },
    { id: "office", label: "Office / desk space", annualAed: officeAnnual, tone: "office" },
    { id: "software", label: "Software & tools", annualAed: softwareAnnual, tone: "software" },
    { id: "hardware", label: `Hardware (amortised over ${amortYears} yrs)`, annualAed: hardwareAnnual, tone: "hardware" },
    { id: "time", label: "Management / review time", annualAed: managementTimeAnnual, tone: "time" },
  ];

  const totalAnnual = lines.reduce((s, l) => s + l.annualAed, 0);
  const monthlyTotal = Math.round(totalAnnual / 12);

  /** Peer bands: illustrative — salary-forward baselines anchored to benchmark mid × typical statutory */
  const midMonthly = bench.monthlyMid;
  const statutoryOnly = defaultStatutoryFromSalary(midMonthly);
  const leanBase =
    bench.monthlyLow * 12 + statutoryOnly.gratuityYear1AccrualAed / 3 + statutoryOnly.noticePeriodBufferAed / 4 + 8500 + 8500 + 8500 + 9500;

  const marketBase =
    midMonthly * 12 +
    statutoryOnly.annualLeaveProvisionAed +
    statutoryOnly.gratuityYear1AccrualAed +
    statutoryOnly.noticePeriodBufferAed +
    18_000 +
    6_500 +
    5_900;

  const peers: PeerBand[] = [
    { label: "Lean (≈10th percentile)", annualAed: Math.round(leanBase), hint: "Organisations ruthlessly trimming loaded cost." },
    { label: "Market (median)", annualAed: Math.round(marketBase), hint: "Typical UAE SME employer posture for comparable seniority.", typical: true },
    { label: "Your estimate", annualAed: totalAnnual, hint: "Based on inputs — includes invisible management time.", yours: true },
  ];

  const estimatedSavingVsFinanshels = Math.round(Math.max(0, totalAnnual - FINANSHELS_REMOTE_ACCOUNTANT_FROM_ANNUAL_AED));

  return {
    monthlyTotal,
    totalAnnual,
    lines,
    roleLabel: bench.role,
    salaryBandLow: bench.monthlyLow,
    salaryBandHigh: bench.monthlyHigh,
    peers,
    estimatedSavingVsFinanshels,
    finanshelsFromAnnual: FINANSHELS_REMOTE_ACCOUNTANT_FROM_ANNUAL_AED,
  };
}
