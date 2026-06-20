import Skeleton from '../Skeleton';

export const ProfileSkeleton = () => (
  <div
    className="min-h-screen flex flex-col items-center p-4 pt-8"
    style={{ backgroundColor: '#000000' }}
    aria-busy="true"
    role="status"
  >
    <Skeleton className="h-24 w-24 rounded-full mb-4" />
    <Skeleton className="h-6 w-40 mb-2" />
    <Skeleton className="h-4 w-24 mb-8" />
    <div className="w-full max-w-sm space-y-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  </div>
);
