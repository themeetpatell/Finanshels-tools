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
  const fullTitle = `${tool.title} — Free UAE Finance Calculator`;

  return {
    title: fullTitle,
    description: tool.ogDescription,
    keywords: [...BASE_KEYWORDS, tool.title, tool.slug.replaceAll("-", " ")].join(", "),
    openGraph: {
      type: "website",
      locale: "en_AE",
      siteName: `${site.name} · ${site.company}`,
      url: `${site.url}${path}`,
      title: `${tool.title} · ${site.name}`,
      description: tool.ogDescription,
      images:
        site.ogImagePath.length > 0 ? [{ url: site.ogImagePath, width: 1200, height: 630, alt: tool.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} · ${site.name}`,
      description: tool.ogDescription,
      images: site.ogImagePath.length > 0 ? [site.ogImagePath] : undefined,
    },
    alternates: {
      canonical: path,
    },
    robots: { index: true, follow: true },
  };
}
