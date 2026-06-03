/**
 * components/ui/ReportCard.tsx — Redesigned v2
 * Clean card with image, status badge, category, metadata.
 */
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, ThumbsUp, MessageCircle, ArrowRight } from 'lucide-react';
import type { Report } from '@/lib/types';
import { StatusBadge, CategoryBadge } from './Badge';
import { formatRelativeTime } from '@/lib/utils';

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link
      href={`/laporan/${report.id}`}
      className="group bg-white overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {report.image_url ? (
          <Image
            src={report.image_url}
            alt={report.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <StatusBadge status={report.status} />
        </div>
        <div className="absolute top-3 right-3">
          <CategoryBadge category={report.category} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-primary-700 transition-colors">
          {report.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1">
          {report.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatRelativeTime(report.created_at)}
          </span>
          {report.lat != null && report.lng != null && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {Number(report.lat).toFixed(3)}, {Number(report.lng).toFixed(3)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" /> {report.upvotes ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" /> {report.comments_count ?? 0}
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Lihat <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
