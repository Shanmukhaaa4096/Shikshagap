import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }> | { token: string };
}

export default async function LegacySharedReportRedirect({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const token = resolvedParams?.token;
  redirect(`/report/${token || ''}`);
}
