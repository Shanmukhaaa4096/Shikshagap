import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans flex flex-col justify-between p-6 sm:p-12">
      <div className="max-w-xl mx-auto my-auto border border-[#432623]/25 dark:border-[#F5F1BC]/25 p-8 bg-[#FAF8E8] dark:bg-[#381f1c]">
        <div className="text-xs font-mono uppercase text-[#DE2A35] font-bold mb-2">
          HTTP 404: Page Not Located
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">Resource Unavailable</h1>
        <p className="text-xs text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed mb-6">
          The requested document or diagnostic route does not exist or has been relocated behind authorized institutional access.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-4 py-2 text-xs font-mono uppercase font-bold hover:bg-[#DE2A35]"
          >
            Return to Public Home
          </Link>
          <Link
            href="/login"
            className="border border-[#432623]/30 dark:border-[#F5F1BC]/30 px-4 py-2 text-xs font-mono uppercase hover:bg-[#F5F1BC]"
          >
            Teacher Login
          </Link>
        </div>
      </div>
      <footer className="text-center text-[11px] font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60">
        ShikshaGap Educational Intelligence
      </footer>
    </div>
  );
}
