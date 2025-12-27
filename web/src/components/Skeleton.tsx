import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * 骨架屏基础组件
 * 用于在内容加载时显示占位符
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted',
        {
          'animate-pulse': animation === 'pulse',
          'animate-shimmer': animation === 'wave',
          'rounded-full': variant === 'circular',
          'rounded-md': variant === 'rounded',
          'rounded-sm': variant === 'text',
        },
        className
      )}
      aria-live="polite"
      aria-busy="true"
    />
  );
}

/**
 * 音乐卡片骨架屏
 */
export function MusicCardSkeleton() {
  return (
    <div className="w-[140px] flex-shrink-0">
      <Skeleton variant="rounded" className="w-[140px] h-[140px] mb-2" />
      <Skeleton variant="text" className="w-full h-4 mb-1" />
      <Skeleton variant="text" className="w-3/4 h-3" />
    </div>
  );
}

/**
 * 专辑/歌手卡片骨架屏
 */
export function AlbumCardSkeleton({ circular = false }: { circular?: boolean }) {
  return (
    <div className="w-full">
      <Skeleton
        variant={circular ? 'circular' : 'rounded'}
        className="w-full aspect-square mb-2"
      />
      <Skeleton variant="text" className="w-full h-4 mb-1" />
      <Skeleton variant="text" className="w-2/3 h-3" />
    </div>
  );
}

/**
 * 列表项骨架屏
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton variant="rounded" className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton variant="text" className="w-3/4 h-4 mb-2" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
      <Skeleton variant="text" className="w-12 h-4" />
    </div>
  );
}

/**
 * 网格骨架屏
 */
export function GridSkeleton({
  count = 12,
  itemComponent: ItemComponent = MusicCardSkeleton,
}: {
  count?: number;
  itemComponent?: React.ComponentType;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ItemComponent key={i} />
      ))}
    </div>
  );
}

/**
 * 播放器骨架屏
 */
export function PlayerSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
      <div className="max-w-[1560px] mx-auto flex items-center gap-4">
        <Skeleton variant="rounded" className="w-14 h-14 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" className="w-1/3 h-4 mb-2" />
          <Skeleton variant="text" className="w-full h-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="circular" className="w-10 h-10" />
          <Skeleton variant="circular" className="w-10 h-10" />
          <Skeleton variant="circular" className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
}

/**
 * 歌词骨架屏
 */
export function LyricsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-6 mx-auto"
          style={{ width: `${Math.random() * 40 + 40}%` }}
        />
      ))}
    </div>
  );
}

/**
 * 统计卡片骨架屏
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <Skeleton variant="circular" className="w-12 h-12 mb-4" />
      <Skeleton variant="text" className="w-20 h-8 mb-2" />
      <Skeleton variant="text" className="w-24 h-4" />
    </div>
  );
}
