import EdukasiDetailClient from './EdukasiDetailClient';
import { STATIC_TRAINING_MODULES } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_TRAINING_MODULES.map((module) => ({ id: module.id }));
}

export default async function EdukasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EdukasiDetailClient id={id} />;
}
