import Skeleton from '../Skeleton';

interface DetailSkeletonProps {
  rows?: number;
  showInspections?: boolean;
}

export const DetailSkeleton = ({ rows = 6, showInspections = true }: DetailSkeletonProps) => (
  <div className="space-y-4" aria-busy="true" role="status">
    <div className="p-3 rounded-lg border space-y-3" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex justify-between items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
    {showInspections && (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )}
  </div>
);
