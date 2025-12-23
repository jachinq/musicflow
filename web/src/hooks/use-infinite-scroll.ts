import { useEffect, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // 距离底部多少像素时触发加载，默认 300px
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 300,
}: UseInfiniteScrollOptions) => {
  const handleScroll = useCallback(() => {
    if (isLoading || !hasMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    // 当滚动到距离底部 threshold 像素时触发加载
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      console.log('触发加载更多', {
        scrollTop,
        scrollHeight,
        clientHeight,
        remaining: scrollHeight - scrollTop - clientHeight,
      });
      onLoadMore();
    }
  }, [onLoadMore, isLoading, hasMore, threshold]);

  useEffect(() => {
    const throttledScroll = throttle(handleScroll, 100);

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // 初始检查，防止内容不足一屏时无法触发滚动
    setTimeout(() => {
      handleScroll();
    }, 100);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [handleScroll]);
};

// 节流函数 - 比防抖更适合滚动事件
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}
