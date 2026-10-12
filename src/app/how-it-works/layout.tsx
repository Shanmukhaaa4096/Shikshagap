import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'How It Works | Pedagogical Architecture | ShikshaGap',
  description: 'Learn how ShikshaGap models mathematics concepts as a directed acyclic graph to uncover foundational misconceptions.',
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
