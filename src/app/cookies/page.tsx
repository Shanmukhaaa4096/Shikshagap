import Link from "next/link";
import { ArrowLeft, Cookie } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Cookie Notice | ${siteConfig.siteName}`,
  description: "Information about strictly necessary cookies and local storage used by ShikshaGap.",
  openGraph: {
    title: `Cookie Notice | ${siteConfig.siteName}`,
    description: "Information about strictly necessary cookies and local storage used by ShikshaGap.",
    url: `${siteConfig.siteUrl}/cookies`,
    siteName: siteConfig.siteName,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.siteName} Cookie Notice` }],
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/cookies`,
  },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-card dark:bg-muted text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href="/"
            className="text-xs font-bold text-foreground hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">
            Last updated: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground text-xs font-mono font-bold rounded-[2px] border border-border">
            <Cookie className="w-4 h-4 text-foreground" />
            <span>STRICTLY NECESSARY STORAGE NOTICE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground">
            Cookie &amp; Local Storage Policy
          </h1>
          <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
            ShikshaGap respects teacher and student privacy. We only use strictly necessary cookies and local browser storage to operate essential platform features.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Zero Advertising &amp; Zero Tracking Cookies
          </h2>
          <p className="text-xs text-foreground/80 dark:text-muted-foreground leading-relaxed">
            We do NOT use Google Analytics, advertising trackers, tracking pixels, behavioral monitors, or UTM campaign tracking. No cookie consent banner is needed because we store no non-essential data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-foreground">
            List of Active Storage Items
          </h2>
          <div className="border border-border rounded-[2px] overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted border-b border-border font-bold">
                <tr>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Exact Purpose</th>
                  <th className="p-2.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-2.5 font-mono font-bold">shikshagap_session</td>
                  <td className="p-2.5">Cookie (HttpOnly, Secure)</td>
                  <td className="p-2.5">Authenticates authorized teachers and school administrators</td>
                  <td className="p-2.5">8 hours</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold">shikshagap_lang</td>
                  <td className="p-2.5">localStorage</td>
                  <td className="p-2.5">Saves user selected language preference (EN, Hindi, Telugu)</td>
                  <td className="p-2.5">Persistent on device</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold">shikshagap_theme</td>
                  <td className="p-2.5">localStorage</td>
                  <td className="p-2.5">Saves user theme choice (light cream / dark brown mode)</td>
                  <td className="p-2.5">Persistent on device</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-6 text-xs text-foreground/80 dark:text-muted-foreground leading-relaxed">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Managing Storage in Your Browser
          </h2>
          <p>
            You can clear cookies and local storage anytime via your browser settings. Clearing your session cookie will require you to log in again to access the diagnostic dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
