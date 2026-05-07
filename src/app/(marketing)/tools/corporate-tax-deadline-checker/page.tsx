import type { Metadata } from "next";

import { CorporateTaxDeadlineClient } from "@/components/tools/corporate-tax-deadline-client";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("corporate-tax-deadline-checker");

export default function CorporateTaxPage() {
  return <CorporateTaxDeadlineClient />;
}
