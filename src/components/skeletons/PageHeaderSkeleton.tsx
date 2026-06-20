import Skeleton from '../Skeleton';

export const PageHeaderSkeleton = () => (
  <div
    className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 border-b"
    style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(28, 28, 30, 0.8)' }}
  >
    <Skeleton className="h-6 w-40" />
    <Skeleton className="h-8 w-8 rounded-full" />
  </div>
);
