import type { MetadataRoute } from "next";

import { site } from "@/lib/config/site";
import { CANONICAL_TOOL_SEQUENCE } from "@/lib/tools/canonical-sequence";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/assessment`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...CANONICAL_TOOL_SEQUENCE.map((slug) => ({
      url: `${base}/tools/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  return staticRoutes;
}
