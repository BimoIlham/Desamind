'use client';
/**
 * components/ui/ReportTimeline.tsx
 * Full lifecycle timeline for a report's status changes.
 */
import { CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import type { ReportHistory } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Laporan Diterima', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-200' },
  { status: 'in_progress', label: 'Sedang Diproses', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
  { status: 'completed', label: 'Selesai Ditangani', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' },
];

type ReportTimelineProps = {
  history: ReportHistory[];
  currentStatus: 'pending' | 'in_progress' | 'completed';
};

export function ReportTimeline({ history, currentStatus }: ReportTimelineProps) {
  const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
  const currentIdx = statusOrder[currentStatus];

  return (
    <div className="bg-white p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-5">Riwayat Status Laporan</h3>

      {/* Visual Steps */}
      <div className="flex items-center mb-6">
        {TIMELINE_STEPS.map((step, i) => {
          const done = statusOrder[step.status as keyof typeof statusOrder] <= currentIdx;
          const active = step.status === currentStatus;
          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 transition-all ${
                  done ? `${step.bg} ${step.ring}` : 'bg-gray-100 ring-gray-200'
                } ${active ? 'scale-110' : ''}`}>
                  {done
                    ? <step.icon className={`w-4 h-4 ${step.color}`} />
                    : <Circle className="w-4 h-4 text-gray-300" />
                  }
                </div>
                <span className={`text-[10px] font-medium mt-1.5 text-center leading-tight max-w-[60px] ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all ${
                  statusOrder[TIMELINE_STEPS[i + 1].status as keyof typeof statusOrder] <= currentIdx
                    ? 'bg-primary-800'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* History Log */}
      <div className="space-y-3">
        {history.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">Belum ada riwayat perubahan status.</p>
        )}
        {history.map((h) => {
          const step = TIMELINE_STEPS.find((s) => s.status === h.status)!;
          return (
            <div key={h.id} className="flex gap-3 items-start">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step?.bg ?? 'bg-gray-50'}`}>
                {step && <step.icon className={`w-3.5 h-3.5 ${step.color}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-800">{step?.label ?? h.status}</span>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-400">{formatRelativeTime(h.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{h.note}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">oleh {h.changed_by}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
