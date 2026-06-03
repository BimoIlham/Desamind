/**
 * components/ui/Skeletons.tsx
 * Reusable skeleton loading components for all data pages.
 */
'use client';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/** Wraps all skeletons with the site's color theme */
export function SkeletonWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SkeletonTheme baseColor="#e8ebe8" highlightColor="#f2f5f2">
      {children}
    </SkeletonTheme>
  );
}

/** Card skeleton — matches ReportCard / ProductCard layout */
export function CardSkeleton() {
  return (
    <SkeletonWrapper>
      <div className="bg-white border border-gray-100 overflow-hidden flex flex-col">
        <Skeleton height={176} className="w-full" />
        <div className="p-4 flex flex-col flex-1 gap-2">
          <Skeleton height={16} width="80%" />
          <Skeleton height={12} count={2} />
          <div className="mt-auto pt-3 border-t border-gray-50 flex gap-4">
            <Skeleton height={12} width={48} />
            <Skeleton height={12} width={48} />
          </div>
        </div>
      </div>
    </SkeletonWrapper>
  );
}

/** Grid of card skeletons */
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${colClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** List row skeleton — for table/list views like admin pages */
export function ListRowSkeleton() {
  return (
    <SkeletonWrapper>
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <Skeleton circle height={40} width={40} />
        <div className="flex-1">
          <Skeleton height={14} width="60%" className="mb-1" />
          <Skeleton height={11} width="40%" />
        </div>
        <Skeleton height={24} width={72} />
      </div>
    </SkeletonWrapper>
  );
}

/** Table skeleton — for admin data tables */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonWrapper>
      <div className="w-full">
        {/* Header */}
        <div className="flex gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <Skeleton height={12} width={120} />
          <Skeleton height={12} width={200} className="flex-1" />
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={80} />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-100 items-center">
            <Skeleton height={14} width={100} />
            <Skeleton height={14} className="flex-1" />
            <Skeleton height={22} width={70} />
            <Skeleton height={28} width={64} />
          </div>
        ))}
      </div>
    </SkeletonWrapper>
  );
}

/** Detail page header skeleton */
export function DetailSkeleton() {
  return (
    <SkeletonWrapper>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton height={256} className="mb-6" />
        <Skeleton height={32} width="70%" className="mb-3" />
        <div className="flex gap-4 mb-5">
          <Skeleton height={14} width={120} />
          <Skeleton height={14} width={100} />
        </div>
        <Skeleton height={120} className="mb-4" />
        <Skeleton height={80} />
      </div>
    </SkeletonWrapper>
  );
}

/** Stats card skeleton — for admin dashboard */
export function StatCardSkeleton() {
  return (
    <SkeletonWrapper>
      <div className="bg-white border border-gray-100 p-5">
        <Skeleton height={12} width={100} className="mb-3" />
        <Skeleton height={32} width={80} className="mb-1" />
        <Skeleton height={11} width={120} />
      </div>
    </SkeletonWrapper>
  );
}
