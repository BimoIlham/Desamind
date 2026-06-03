import GotongRoyongDetailClient from './GotongRoyongDetailClient';
import { STATIC_ACTIONS } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_ACTIONS.map((action) => ({ id: action.id }));
}

export default async function GotongRoyongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GotongRoyongDetailClient id={id} />;
}
