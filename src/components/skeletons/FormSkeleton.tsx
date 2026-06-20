import Skeleton from '../Skeleton';

interface FormSkeletonProps {
  fields?: number;
  showSubmit?: boolean;
}

export const FormSkeleton = ({ fields = 4, showSubmit = true }: FormSkeletonProps) => (
  <div className="space-y-4" aria-busy="true" role="status">
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    ))}
    {showSubmit && <Skeleton className="h-12 w-full rounded-lg mt-6" />}
  </div>
);
