import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Teacher Sign In | ShikshaGap',
  description: 'Sign in to access your classroom diagnostic dashboard and student learning gap profiles.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
