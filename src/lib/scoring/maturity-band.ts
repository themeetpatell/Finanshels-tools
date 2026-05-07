import { UAE_RULES } from "@/lib/config/uaeRules";

export type MaturityBandId = "fragile" | "developing" | "stable" | "scale-ready";

export function maturityBandFromScore(score: number): {
  band: MaturityBandId;
  label: string;
  description: string;
} {
  const { fragileMax, developingMax, stableMax } = UAE_RULES.maturity;

  if (score <= fragileMax) {
    return {
      band: "fragile",
      label: "Fragile",
      description:
        "Finance is reacting, not steering. Risks concentrate in blind spots across compliance and cash visibility.",
    };
  }

  if (score <= developingMax) {
    return {
      band: "developing",
      label: "Developing",
      description:
        "Foundations exist, but variability is still high — reporting, forecasting, or controls lag the business rhythm.",
    };
  }

  if (score <= stableMax) {
    return {
      band: "stable",
      label: "Stable",
      description:
        "Core finance rhythms work. Optimize for scalability, sharper margins, and board-grade reporting hygiene.",
    };
  }

  return {
    band: "scale-ready",
    label: "Scale-ready",
    description:
      "Finance is an operating lever — repeatable close, disciplined cash posture, credible reporting, and scalable team design.",
  };
}
