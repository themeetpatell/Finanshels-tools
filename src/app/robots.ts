import type { MetadataRoute } from "next";

import { site } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const host = site.url.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
