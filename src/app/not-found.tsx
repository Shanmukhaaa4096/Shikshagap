import React from 'react';
import Link from 'next/link';
import { NotFoundIllustration } from '@/components/illustrations/StateIllustrations';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8E8] dark:bg-[#432623] text-[#432623] dark:text-[#F5F1BC] font-sans flex flex-col justify-between p-6 sm:p-12">
      <div className="max-w-xl mx-auto my-auto border-2 border-[#432623]/25 dark:border-[#F5F1BC]/25 p-8 bg-[#FAF8E8] dark:bg-[#381f1c] text-center sm:text-left">
        <div className="flex justify-center sm:justify-start mb-4">
          <NotFoundIllustration className="w-48 h-auto" />
        </div>
        <div className="text-sm font-mono uppercase text-[#DE2A35] font-bold mb-2">
          HTTP 404 : Resource Not Found
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">Page Not Located</h1>
        <p className="text-sm text-[#432623]/80 dark:text-[#F5F1BC]/80 leading-relaxed mb-6">
          The requested document or diagnostic route does not exist or has been relocated behind authorized institutional access.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="border-2 border-[#DE2A35] bg-[#DE2A35] text-[#FAF8E8] px-4 py-2 text-sm font-mono uppercase font-bold hover:bg-[#B51E28] transition-colors"
          >
            Assess Test (Start Diagnostic)
          </Link>
          <Link
            href="/"
            className="border border-[#432623] dark:border-[#F5F1BC] bg-[#432623] text-[#F5F1BC] dark:bg-[#F5F1BC] dark:text-[#432623] px-4 py-2 text-sm font-mono uppercase font-bold hover:bg-[#DE2A35] hover:text-[#FAF8E8] transition-colors"
          >
            Return to Home
          </Link>
          <Link
            href="/login"
            className="border border-[#432623]/30 dark:border-[#F5F1BC]/30 px-4 py-2 text-sm font-mono uppercase hover:bg-[#F5F1BC] dark:hover:bg-[#432623] transition-colors"
          >
            Teacher Login
          </Link>
        </div>
      </div>
      <footer className="text-center text-sm font-mono text-[#432623]/60 dark:text-[#F5F1BC]/60">
        ShikshaGap Educational Intelligence
      </footer>
    </div>
  );
}
