/**
 * components/ui/Badge.tsx — Redesigned v2
 * Consistent badge component with icon support and refined colors.
 */
import { CheckCircle, Clock, Wrench, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Status configuration ────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: LucideIcon }> = {
  pending: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    Icon: Clock,
  },
  in_progress: {
    label: 'Diproses',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    Icon: Wrench,
  },
  done: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle,
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle,
  },
  rejected: {
    label: 'Ditolak',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    Icon: XCircle,
  },
};

// ── Category colors ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Infrastruktur': 'bg-slate-100 text-slate-700 border-slate-200',
  'Sampah':        'bg-green-50 text-green-700 border-green-200',
  'Kesehatan':     'bg-pink-50 text-pink-700 border-pink-200',
  'Keamanan':      'bg-purple-50 text-purple-700 border-purple-200',
  'Lingkungan':    'bg-teal-50 text-teal-700 border-teal-200',
  'Sosial':        'bg-indigo-50 text-indigo-700 border-indigo-200',
  default:         'bg-gray-100 text-gray-600 border-gray-200',
};

// ── Components ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  const { label, className, Icon } = config;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const className = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border', className)}>
      {category}
    </span>
  );
}
