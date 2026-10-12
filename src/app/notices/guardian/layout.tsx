import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Guardian Consent Notice | ShikshaGap',
  description: 'Download and print parental consent notices for student diagnostic assessments in English, Hindi, and Telugu.',
};

export default function GuardianNoticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
