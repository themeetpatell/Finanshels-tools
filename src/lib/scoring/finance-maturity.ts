import { maturityBandFromScore } from "@/lib/scoring/maturity-band";

export type FinanceMaturityAnswers = {
  compliancePosture: 0 | 1 | 2 | 3; // weakest → strongest
  vatGovernance: 0 | 1 | 2 | 3;
  ctReadinessArtifacts: 0 | 1 | 2 | 3;
  cashForecastHorizonWeeks: 0 | 1 | 2 | 3;
  debtorControl: 0 | 1 | 2 | 3;
  apDiscipline: 0 | 1 | 2 | 3;
  monthEndCloseCadence: 0 | 1 | 2 | 3;
  policyControlEnvironment: 0 | 1 | 2 | 3;
  managementReportingQuality: 0 | 1 | 2 | 3;
  boardInvestorReporting: 0 | 1 | 2 | 3;
  teamStructureCoverage: 0 | 1 | 2 | 3;
};

const map = (v: FinanceMaturityAnswers[keyof FinanceMaturityAnswers]) => {
  return (v / 3) * 100;
};

const DIM_WEIGHTS = {
  compliance: 0.22,
  cashflow: 0.22,
  financeOps: 0.2,
  reporting: 0.18,
  teamStructure: 0.18,
} as const;

export type FinanceMaturityDimensions = {
  compliance: number;
  cashflow: number;
  financeOps: number;
  reporting: number;
  teamStructure: number;
};

export function computeFinanceMaturity(answers: FinanceMaturityAnswers) {
  const compliance =
    map(answers.compliancePosture) * 0.45 + map(answers.vatGovernance) * 0.3 + map(answers.ctReadinessArtifacts) * 0.25;

  const cashflow =
    map(answers.cashForecastHorizonWeeks) * 0.4 + map(answers.debtorControl) * 0.35 + map(answers.apDiscipline) * 0.25;

  const financeOps =
    map(answers.monthEndCloseCadence) * 0.55 + map(answers.policyControlEnvironment) * 0.45;

  const reporting =
    map(answers.managementReportingQuality) * 0.6 + map(answers.boardInvestorReporting) * 0.4;

  const teamStructure = map(answers.teamStructureCoverage);

  const overallRaw =
    compliance * DIM_WEIGHTS.compliance +
    cashflow * DIM_WEIGHTS.cashflow +
    financeOps * DIM_WEIGHTS.financeOps +
    reporting * DIM_WEIGHTS.reporting +
    teamStructure * DIM_WEIGHTS.teamStructure;

  const overall = Math.round(Math.min(100, Math.max(0, overallRaw)));

  const dimensions = {
    compliance: Math.round(compliance),
    cashflow: Math.round(cashflow),
    financeOps: Math.round(financeOps),
    reporting: Math.round(reporting),
    teamStructure: Math.round(teamStructure),
  };

  const bandMeta = maturityBandFromScore(overall);

  const topRisks = buildTopRisks(dimensions);
  const topPriorities = buildTopPriorities(dimensions);

  return {
    overall,
    dimensions,
    band: bandMeta.band,
    bandLabel: bandMeta.label,
    bandDescription: bandMeta.description,
    topRisks,
    topPriorities,
    weightsUsed: DIM_WEIGHTS,
  };
}

function buildTopRisks(d: FinanceMaturityDimensions) {
  const ranked = (
    Object.entries(d) as Array<[keyof typeof d, number]>
  ).sort((a, b) => a[1] - b[1]);
  const labels: Record<string, string> = {
    compliance: "Compliance & governance backlog",
    cashflow: "Cash visibility / working capital leakage",
    financeOps: "Close, controls, or policy gaps",
    reporting: "Reporting that cannot support decisions yet",
    teamStructure: "Under-resourced finance structure for current scale",
  };
  return ranked.slice(0, 3).map(([key]) => ({
    dimension: key,
    title: labels[key] ?? key,
  }));
}

function buildTopPriorities(d: FinanceMaturityDimensions) {
  /** Priorities are mirrored from weakest dimensions with pragmatic actions */
  const weakestFirst = (
    Object.entries(d) as Array<[keyof typeof d, number]>
  ).sort((a, b) => a[1] - b[1]);

  const playbooks: Record<string, string> = {
    compliance:
      "Build a filings calendar owner, document repository, and month-end checklist mapped to UAE obligations.",
    cashflow:
      "Implement a rolling 13-week cash view, tighten collections cadence, and separate strategic vs survival spend.",
    financeOps:
      "Hard-define month-end tasks, segregation basics, and month-1 KPI pack for operators — stop ad-hoc close.",
    reporting:
      "Move from P&L-only to margin bridges, cohort/segment profitability, and a single source of KPI truth.",
    teamStructure:
      "Right-size finance roles versus workload — often a controller-grade operator plus fractional CFO spike.",
  };

  return weakestFirst.slice(0, 3).map(([key]) => ({
    title: playbooks[key] ?? `Strengthen ${key}`,
  }));
}
