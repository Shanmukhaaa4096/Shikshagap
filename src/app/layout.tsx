import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  Source_Serif_4,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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

export const metadata: Metadata = {
  title: "ShikshaGap | Learning Intelligence and Diagnostic System",
  description:
    "Editorial diagnostic intelligence platform for Indian elementary mathematics education. Evaluates understanding, identifies foundational gaps, and suggests recovery paths.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${sourceSerif.variable} ${notoDevanagari.variable} ${notoTelugu.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
