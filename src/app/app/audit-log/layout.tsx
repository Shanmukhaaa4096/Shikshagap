import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Institutional Audit Ledger | ShikshaGap',
  description: 'Tamper-evident administrative audit log for verified classroom assessment events.',
};

export default function AuditLogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
