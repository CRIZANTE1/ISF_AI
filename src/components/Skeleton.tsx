interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return <div className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`} />;
};

export default Skeleton;
