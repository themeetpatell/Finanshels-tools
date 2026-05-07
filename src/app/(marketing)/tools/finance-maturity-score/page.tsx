import type { Metadata } from "next";

import { FinanceMaturityClient } from "@/components/tools/finance-maturity-client";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("finance-maturity-score");

export default function FinanceMaturityPage() {
  return <FinanceMaturityClient />;
}
