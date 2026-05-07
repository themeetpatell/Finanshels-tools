import { site } from "@/lib/config/site";

export function homeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${site.name} by ${site.company}`,
    description:
      "Assessment-led toolkit for UAE businesses to prioritize finance maturity, liquidity, filings hygiene, and team design.",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AED",
    },
    creator: {
      "@type": "Organization",
      name: site.company,
      url: site.url,
    },
  };
}

export function faqStructuredData(entries: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
