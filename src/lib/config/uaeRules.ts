/**
 * Editable UAE compliance-related constants for estimators and checks.
 * Update here when guidance thresholds change — avoid scattering magic numbers in UI.
 *
 * IMPORTANT: Estimators are informational only and must be validated with a qualified advisor.
 */
export const UAE_RULES = {
  meta: {
    schemaVersion: "2026-05-07",
    jurisdictionNote:
      "UAE-facing guidance for mainland and free zone operators. Rules evolve — confirm with your advisor.",
  },

  /** Corporate tax filing/payment estimator (config-driven; confirm legally). */
  corporateTax: {
    /** Months after financial year end for assumed filing/payment due date baseline. */
    filingDueMonthsAfterFinancialYearEnd: 9,
    /** If true, payment due is modeled the same as filing due (simplification). */
    paymentDueSameAsFiling: true,
    /** Warning if due within this many days. */
    urgentWithinDays: 45,
    /** Warning if due within this many days (sooner than urgent). */
    criticalWithinDays: 14,
    disclaimer:
      "This is an informational deadline estimator based on configurable rules. Deadlines depend on your entity facts, elections, and FTA guidance. Confirm with a tax professional before relying on dates.",
  },

  maturity: {
    fragileMax: 39,
    developingMax: 59,
    stableMax: 79,
  },

  revenueBandsAed: [
    { id: "lt_500k", label: "Under AED 500k" },
    { id: "500k_2m", label: "AED 500k – 2M" },
    { id: "2m_10m", label: "AED 2M – 10M" },
    { id: "10m_50m", label: "AED 10M – 50M" },
    { id: "gt_50m", label: "AED 50M+" },
  ] as const,
} as const;

export type RevenueBandId = (typeof UAE_RULES.revenueBandsAed)[number]["id"];
