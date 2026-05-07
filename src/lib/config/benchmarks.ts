/** Preset salary benchmarks (AED / month). Adjust as Finanshels updates market data. */
export const ROLE_SALARY_BENCHMARKS_AED = {
  accountant: { role: "Accountant", monthlyLow: 8000, monthlyMid: 12000, monthlyHigh: 18000 },
  senior_accountant: {
    role: "Senior Accountant",
    monthlyLow: 14000,
    monthlyMid: 19000,
    monthlyHigh: 26000,
  },
  finance_manager: {
    role: "Finance Manager",
    monthlyLow: 22000,
    monthlyMid: 32000,
    monthlyHigh: 45000,
  },
  financial_controller: {
    role: "Financial Controller",
    monthlyLow: 35000,
    monthlyMid: 48000,
    monthlyHigh: 70000,
  },
  fractional_cfo: {
    role: "CFO / Fractional CFO",
    monthlyLow: 45000,
    monthlyMid: 65000,
    monthlyHigh: 95000,
  },
} as const;

export type RoleBenchmarkKey = keyof typeof ROLE_SALARY_BENCHMARKS_AED;

/** Typical outsourced finance packages (AED / month) — illustrative bands for comparison */
export const OUTSOURCING_PACKAGE_BANDS_AED = {
  core_bookkeeping: { label: "Core bookkeeping & VAT support", monthlyLow: 2500, monthlyHigh: 8000 },
  managed_finance_ops: {
    label: "Managed finance ops (reporting + control)",
    monthlyLow: 8000,
    monthlyHigh: 22000,
  },
  controller_plus: {
    label: "Controller-grade + strategic support",
    monthlyLow: 18000,
    monthlyHigh: 45000,
  },
} as const;

export type OutsourcingPackageKey = keyof typeof OUTSOURCING_PACKAGE_BANDS_AED;
