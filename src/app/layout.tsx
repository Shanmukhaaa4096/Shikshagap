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

export const metadata: Metadata = {
  title: "ShikshaGap | Find out what each student needs to learn next",
  description:
    "ShikshaGap checks a student's understanding, finds the topics that need more practice and helps teachers plan the next lesson in Indian primary schools.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
