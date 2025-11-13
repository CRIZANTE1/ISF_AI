interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div 
      className={`rounded-md animate-pulse ${className}`} 
      style={{ 
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
      }} 
    />
  );
};

export default Skeleton;
