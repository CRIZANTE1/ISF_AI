interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return <div className={`rounded-md animate-pulse ${className}`} style={{ backgroundColor: '#2A2A2A' }} />;
};

export default Skeleton;
