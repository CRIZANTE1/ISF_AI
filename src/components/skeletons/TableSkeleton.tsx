import Skeleton from '../Skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => (
  <div className="space-y-3" aria-busy="true" role="status">
    <div className="flex gap-3">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-8 flex-1 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-10 flex-1 rounded" />
        ))}
      </div>
    ))}
  </div>
);
