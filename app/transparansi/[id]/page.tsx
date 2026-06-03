import TransparansiDetailClient from './TransparansiDetailClient';
import { STATIC_PROJECTS } from '@/lib/static-data';

export const dynamicParams = false;

export function generateStaticParams() {
  return STATIC_PROJECTS.map((project) => ({ id: project.id }));
}

export default async function TransparansiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransparansiDetailClient id={id} />;
}
