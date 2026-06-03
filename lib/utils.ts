/**
 * lib/utils.ts
 * Shared utility functions used throughout the app.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format Indonesian Rupiah currency */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format a date to Indonesian locale string */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

/** Format relative time (e.g., "2 hari lalu") */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return formatDate(dateString);
}

/** Report status display configurations */
export const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu',
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    markerColor: '#EF4444',
  },
  in_progress: {
    label: 'Diproses',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dotColor: 'bg-yellow-500',
    markerColor: '#FBC02D',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-green-100 text-green-700 border-green-200',
    dotColor: 'bg-green-500',
    markerColor: '#1B5E20',
  },
} as const;

/** Report category display configurations */
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  Infrastruktur: { label: 'Infrastruktur', icon: '🏗️', color: 'bg-blue-100 text-blue-700' },
  Sampah: { label: 'Sampah', icon: '🗑️', color: 'bg-orange-100 text-orange-700' },
  Kesehatan: { label: 'Kesehatan', icon: '🏥', color: 'bg-red-100 text-red-700' },
  Keamanan: { label: 'Keamanan', icon: '🔒', color: 'bg-purple-100 text-purple-700' },
  Pendidikan: { label: 'Pendidikan', icon: '📚', color: 'bg-indigo-100 text-indigo-700' },
  Lingkungan: { label: 'Lingkungan', icon: '🌿', color: 'bg-green-100 text-green-700' },
  Lainnya: { label: 'Lainnya', icon: '📋', color: 'bg-gray-100 text-gray-700' },
};
