'use client';
/**
 * app/_components/HomeLatestReports.tsx
 *
 * Client Component — hanya bagian "Laporan Terbaru" yang perlu
 * interaktivitas (stagger animation via Framer Motion).
 * Menerima data yang sudah di-fetch dari Server Component (page.tsx),
 * sehingga tidak ada fetch ulang di sisi browser.
 */
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { ReportCard } from '@/components/ui/ReportCard';
import type { Report } from '@/lib/types';

interface HomeLatestReportsProps {
  reports: Report[];
  /** Label tombol "Lihat Semua" — dikirim dari Server Component */
  labelTitle: string;
  labelViewAll: string;
}

export function HomeLatestReports({
  reports,
  labelTitle,
  labelViewAll,
}: HomeLatestReportsProps) {
  return (
    <section className="py-14 lg:py-16 bg-bg border-t border-gray-200/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection
          as="div"
          animation="fade-from-left"
          className="flex justify-between items-end mb-8 lg:mb-10"
        >
          <h2 className="text-2xl font-bold text-primary-950">{labelTitle}</h2>
          <Link
            href="/laporan"
            className="text-[10px] font-bold tracking-widest uppercase text-white bg-primary-700 px-6 py-2"
          >
            {labelViewAll}
          </Link>
        </AnimatedSection>

        {reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Belum ada laporan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.map((report, i) => (
              <AnimatedSection
                as="div"
                animation="fade-up"
                delay={i * 0.15}
                key={report.id}
              >
                <ReportCard report={report} />
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
