import type { Metadata } from "next";

import { site } from "@/lib/config/site";
import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

const BASE_KEYWORDS = [
  "UAE finance",
  "Finanshels",
  "Finance Navigator",
  "Dubai SME",
  "CFO tools",
  "corporate tax UAE",
] as const;

export function toolPageMetadata(slug: ToolSlug): Metadata {
  const tool = TOOLS_BY_SLUG[slug];
  const path = `/tools/${slug}`;

  return {
    title: tool.title,
    description: tool.ogDescription,
    keywords: [...BASE_KEYWORDS, tool.title, tool.purpose.slice(0, 80)].join(", "),
    openGraph: {
      type: "website",
      locale: "en_AE",
      siteName: `${site.name} · ${site.company}`,
      url: `${site.url}${path}`,
      title: `${tool.title} · Finance Navigator`,
      description: tool.ogDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} · Finance Navigator`,
      description: tool.ogDescription,
    },
    alternates: {
      canonical: path,
    },
    robots: { index: true, follow: true },
  };
}
