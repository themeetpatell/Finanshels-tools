import type { Metadata } from "next";

import { FinancialHealthClient } from "@/components/tools/financial-health-client";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("financial-health-checkup");

export default function FinancialHealthPage() {
  return <FinancialHealthClient />;
}
