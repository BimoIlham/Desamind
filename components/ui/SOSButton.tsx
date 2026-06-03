'use client';
/**
 * components/ui/SOSButton.tsx — Redesigned v2
 * Clean floating emergency button with slide-up panel.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X, Flame, Droplets, Car, Heart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPES = [
  { type: 'fire',     label: 'Kebakaran',  Icon: Flame,    color: 'text-red-600',    bg: 'hover:bg-red-50' },
  { type: 'flood',    label: 'Banjir',     Icon: Droplets, color: 'text-blue-600',   bg: 'hover:bg-blue-50' },
  { type: 'accident', label: 'Kecelakaan', Icon: Car,      color: 'text-orange-600', bg: 'hover:bg-orange-50' },
  { type: 'medical',  label: 'Darurat Medis', Icon: Heart, color: 'text-pink-600',   bg: 'hover:bg-pink-50' },
  { type: 'crime',    label: 'Keamanan',   Icon: Shield,   color: 'text-violet-600', bg: 'hover:bg-violet-50' },
];

export function SOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Panel */}
        {open && (
          <div className="dropdown-enter bg-white shadow-xl border border-gray-100 overflow-hidden w-52">
            <div className="px-4 py-3 bg-red-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">SOS &mdash; Pilih Darurat</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="py-1.5">
              {TYPES.map(({ type, label, Icon, color, bg }) => (
                <Link
                  key={type}
                  href={`/sos?type=${type}`}
                  onClick={() => setOpen(false)}
                  className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-800 transition', bg)}
                >
                  <Icon className={cn('w-4 h-4', color)} />
                  {label}
                </Link>
              ))}
              <div className="px-4 py-2 border-t border-gray-100">
                <Link href="/sos" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 w-full py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">
                  <ShieldAlert className="w-3.5 h-3.5" /> Form Lengkap
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
            open
              ? 'bg-gray-800 shadow-gray-800/30 rotate-12'
              : 'bg-red-600 shadow-red-500/50 hover:bg-red-700 hover:scale-110'
          )}
          aria-label="SOS Emergency"
        >
          {open ? <X className="w-6 h-6 text-white" /> : <ShieldAlert className="w-6 h-6 text-white" />}
        </button>
      </div>
    </>
  );
}
