import Skeleton from '../Skeleton';

export const MapSkeleton = () => (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000000' }} aria-busy="true" role="status">
    <div className="px-4 py-3 border-b space-y-2" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="flex-1 w-full rounded-none" style={{ minHeight: 'calc(100vh - 120px)' }} />
  </div>
);
