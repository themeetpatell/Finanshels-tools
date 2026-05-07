export const TRACK_ORDER = [
  "start_right",
  "stay_compliant",
  "stay_in_control",
  "scale_smarter",
] as const;

export type TrackId = (typeof TRACK_ORDER)[number];

export const TRACK_LABELS: Record<TrackId, { title: string; subtitle: string }> = {
  start_right: {
    title: "Start Right",
    subtitle: "Set up finance hires, tooling, and operating cadence without overbuilding.",
  },
  stay_compliant: {
    title: "Stay Compliant",
    subtitle: "VAT, corporate tax timelines, documentation discipline, and filings hygiene.",
  },
  stay_in_control: {
    title: "Stay in Control",
    subtitle: "Cash visibility, margins, collections, and month-end you can trust.",
  },
  scale_smarter: {
    title: "Scale Smarter",
    subtitle: "Reporting, forecasting, governance, and finance operating model for growth.",
  },
};
