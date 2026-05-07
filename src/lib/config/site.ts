export const site = {
  name: "Finance Navigator",
  company: "Finanshels",
  tagline:
    "UAE-focused finance clarity for founders, CFOs, and operators — assessment-led tools with actionable outputs.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
  whatsappE164: process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "971500000000",
  consultationUrl:
    process.env.NEXT_PUBLIC_CONSULTATION_URL ??
    "https://finanshels.com/contact",
  ogImagePath: "/opengraph.png",
} as const;

export function whatsappHref(message?: string) {
  const base = `https://wa.me/${site.whatsappE164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
