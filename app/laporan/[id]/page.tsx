import LaporanDetailClient from './LaporanDetailClient';
import { STATIC_REPORTS } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_REPORTS.map((report) => ({ id: report.id }));
}

export default async function LaporanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LaporanDetailClient id={id} />;
}
