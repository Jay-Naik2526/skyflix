export default function Skeleton({ className }: { className?: string }) {
    return (
      <div className={`bg-gray-800/50 animate-pulse rounded-md ${className}`} />
    );
  }