import { site } from "@/lib/config/site";

export function homeStructuredData() {
  const orgUrl = site.url.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: `${site.name} · ${site.company}`,
        url: orgUrl,
        description:
          "Free UAE finance assessment and calculators: maturity scoring, profitability health, cashflow, corporate tax timelines, and hire vs outsourced finance benchmarking.",
        publisher: {
          "@type": "Organization",
          name: site.company,
          url: orgUrl,
        },
        inLanguage: "en-AE",
      },
      {
        "@type": "SoftwareApplication",
        name: `${site.name} by ${site.company}`,
        description:
          "Free Finance Navigator toolkit for UAE founders and CFOs — assessment routing plus AED-native calculators for maturity, liquidity, filings, and team economics.",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "AED",
        },
        creator: {
          "@type": "Organization",
          name: site.company,
          url: orgUrl,
        },
      },
    ],
  };
}
