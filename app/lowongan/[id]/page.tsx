import LowonganDetailClient from './LowonganDetailClient';
import { STATIC_JOBS } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_JOBS.map((job) => ({ id: job.id }));
}

export default async function LowonganDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LowonganDetailClient id={id} />;
}
