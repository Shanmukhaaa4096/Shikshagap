import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'DPDP 2023 Principles Data Subject Request | ShikshaGap',
  description: 'Submit personal data access, correction, deletion, or grievance requests following India Digital Personal Data Protection Act 2023 principles.',
};

export default function DataRequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
