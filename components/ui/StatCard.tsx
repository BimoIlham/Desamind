/**
 * components/ui/StatCard.tsx — Redesigned v2
 * KPI card with icon, value, label, and optional trend indicator.
 */
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, trendUp, accent, className }: StatCardProps) {
  return (
    <div className={cn(
      'relative bg-white p-6 border border-gray-200 overflow-hidden transition-colors hover:border-primary-400',
      className
    )}>
      {/* Decorative bg blob */}
      <div className={cn(
        'absolute -top-10 -right-10 w-24 h-24 opacity-5 rotate-12',
        accent ? 'bg-accent-500' : 'bg-primary-800'
      )} />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className={cn(
          'w-10 h-10 border flex items-center justify-center',
          accent ? 'border-accent-200 bg-accent-50' : 'border-primary-200 bg-primary-50'
        )}>
          <Icon className={cn('w-4 h-4', accent ? 'text-accent-600' : 'text-primary-800')} />
        </div>

        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 border',
            trendUp
              ? 'text-green-700 bg-green-50 border-green-200'
              : 'text-red-700 bg-red-50 border-red-200'
          )}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>

      <div className="text-3xl font-semibold text-primary-950 mb-2 relative z-10">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 relative z-10">{label}</div>
    </div>
  );
}
