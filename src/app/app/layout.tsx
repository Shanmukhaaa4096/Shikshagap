import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Diagnostic Workspace | ShikshaGap',
  description: 'Conduct adaptive foundational mathematics diagnostic assessments for primary school students across Classes 3 to 5.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
