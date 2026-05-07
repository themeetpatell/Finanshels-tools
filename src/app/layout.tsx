import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { site } from "@/lib/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#082032",
  width: "device-width",
  initialScale: 1,
};

const defaultTitle = `Finance Navigator — Free UAE CFO Tools & Assessments`;

const seoDescription =
  "Free Finance Navigator tools for UAE businesses: maturity score, financial health check, cashflow stress test, corporate tax deadline estimator (informational), and finance hire vs outsource benchmark. AED-native calculators by Finanshels.";

const keywords =
  "UAE finance calculator, Dubai SME finance, UAE corporate tax estimate, AED cashflow, finance maturity assessment UAE, outsource finance Dubai, CFO tools UAE";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: defaultTitle,
    template: "%s · Finance Navigator · Finanshels",
  },
  description: seoDescription,
  keywords,
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Finance Navigator · Finanshels",
    title: defaultTitle,
    description: seoDescription,
    url: site.url,
    images:
      site.ogImagePath.length > 0
        ? [
            {
              url: site.ogImagePath,
              width: 1200,
              height: 630,
              alt: "Finance Navigator by Finanshels",
            },
          ]
        : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: seoDescription,
    images: site.ogImagePath.length > 0 ? [site.ogImagePath] : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full font-sans`}>
      <body className="min-h-screen flex flex-col bg-background antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
