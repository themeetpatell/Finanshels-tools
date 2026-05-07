import type { Metadata } from "next";

import { HiringBenchmarkClient } from "@/components/tools/hiring-benchmark-client";
import { toolPageMetadata } from "@/lib/seo/tool-metadata";

export const metadata: Metadata = toolPageMetadata("hiring-vs-outsourcing-benchmark");

export default function HiringBenchmarkPage() {
  return <HiringBenchmarkClient />;
}
