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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Finance Navigator by Finanshels",
    template: "%s · Finance Navigator",
  },
  description:
    "UAE-focused Finance Navigator toolkit — sequential assessments & calculators spanning compliance, liquidity, filings timing, maturity scoring, and finance team economics.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Finance Navigator · Finanshels",
    title: "Finance Navigator by Finanshels",
    description:
      "Trust-forward finance tooling for founders, CFOs, and UAE operators — route, score, capture, escalate.",
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance Navigator by Finanshels",
    description: "Finance clarity for UAE SMEs — routed tools, AED-native economics.",
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
