import type { Metadata } from "next";
import {
  Instrument_Serif,
  Bricolage_Grotesque,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-telugu",
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  display: "swap",
});

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { CookieBanner } from "@/components/CookieBanner";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
  description:
    "ShikshaGap checks a student's understanding, finds the topics that need more practice and helps teachers plan the next lesson in Indian primary schools.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: `${siteConfig.siteName} | Find out what each student needs to learn next`,
    description:
      "AI agent that assesses students across Classes 3 to 5 and finds their foundational learning gaps.",
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShikshaGap - AI Educational Diagnostic Agent",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShikshaGap | Find out what each student needs to learn next",
    description:
      "AI agent that assesses students across Classes 3 to 5 and finds their foundational learning gaps.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${instrumentSerif.variable} ${notoDevanagari.variable} ${notoTelugu.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ServiceWorkerRegister />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
