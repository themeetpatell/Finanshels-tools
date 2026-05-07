import type { Metadata } from "next";

import { CashflowHealthClient } from "@/components/tools/cashflow-health-client";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("cashflow-health-checkup");

export default function CashflowHealthPage() {
  return <CashflowHealthClient />;
}
