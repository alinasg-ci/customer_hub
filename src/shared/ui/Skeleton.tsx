import { cn } from '@/shared/utils/cn';

type SkeletonProps = {
  readonly className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-[12px] bg-oat-200', className)}
    />
  );
}
