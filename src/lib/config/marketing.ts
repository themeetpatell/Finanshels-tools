import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

/**
 * Optional: featured calculator on the homepage (`NEXT_PUBLIC_LEAD_MAGNET_TOOL_SLUG`).
 * Any tool can be promoted with ` /tools/[slug]?promo=1` — see PromoToolCapture + README.
 */
const RAW = process.env.NEXT_PUBLIC_LEAD_MAGNET_TOOL_SLUG?.trim();

export function getFeaturedLeadMagnetSlug(): ToolSlug | null {
  if (!RAW) return null;
  if (!(RAW in TOOLS_BY_SLUG)) return null;
  return RAW as ToolSlug;
}

/** Campaign-friendly path; add UTMs from your ads manager as extra query params. */
export function leadMagnetPromoPath(slug: ToolSlug): string {
  return `/tools/${slug}?promo=1`;
}
