import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import TeacherPortalView from './TeacherPortalView';

export const metadata: Metadata = {
  title: 'Teacher Portal | ShikshaGap',
  description: 'Protected portal for verified teachers to access classroom diagnostics and learning gap analyses.',
  robots: {
    index: false,
    follow: false,
  },
};

async function TeacherProtectedContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const teacherName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.first_name ||
    user.email?.split('@')[0] ||
    'Teacher';

  const teacherEmail = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <TeacherPortalView
      teacherName={teacherName}
      teacherEmail={teacherEmail}
      avatarUrl={avatarUrl}
    />
  );
}

export default function TeacherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm font-mono text-muted-foreground">
          Loading Teacher Portal...
        </div>
      }
    >
      <TeacherProtectedContent />
    </Suspense>
  );
}
