import type { Metadata } from "next";

import { AssessmentClient } from "@/components/tools/assessment-client";
import { site } from "@/lib/config/site";

const desc =
  "Deterministic UAE finance routing — mainland vs free zone, compliance posture, and urgency surfaced into prioritized tool sequences.";

export const metadata: Metadata = {
  title: "Finance Navigator Assessment",
  description: desc,
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: `${site.url}/assessment`,
    title: "Finance Navigator Assessment",
    description: desc,
    siteName: `${site.name} · Finanshels`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance Navigator Assessment",
    description: desc,
  },
  alternates: { canonical: "/assessment" },
};

export default function AssessmentPage() {
  return <AssessmentClient />;
}
