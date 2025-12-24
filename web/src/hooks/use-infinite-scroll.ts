import { useEffect, useCallback, RefObject } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // 距离底部多少像素时触发加载,默认 300px
  containerRef?: RefObject<HTMLElement | null>; // 可选的滚动容器引用
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 300,
  containerRef,
}: UseInfiniteScrollOptions) => {
  const handleScroll = useCallback(() => {
    if (isLoading || !hasMore) {
      return;
    }

    let scrollTop, scrollHeight, clientHeight;

    // 如果提供了容器引用,监听容器滚动;否则监听 window 滚动
    if (containerRef?.current) {
      const container = containerRef.current;
      scrollTop = container.scrollTop;
      scrollHeight = container.scrollHeight;
      clientHeight = container.clientHeight;
    } else {
      scrollTop = document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = document.documentElement.clientHeight;
    }

    // console.log('滚动状态', {
    //   scrollTop,
    //   scrollHeight,
    //   clientHeight,
    //   remaining: scrollHeight - scrollTop - clientHeight,
    // });
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
  }, [onLoadMore, isLoading, hasMore, threshold, containerRef]);

  useEffect(() => {
    // console.log('useInfiniteScroll useEffect 执行');
    // console.log('containerRef:', containerRef);
    // console.log('containerRef?.current:', containerRef?.current);

    const throttledScroll = throttle(handleScroll, 100);

    const scrollTarget = containerRef?.current || window;
    // if (containerRef?.current) {
    //   console.log('监听容器', containerRef.current);
    // } else {
    //   console.log('监听 window');
    // }

    scrollTarget.addEventListener('scroll', throttledScroll as any, { passive: true });

    // 初始检查,防止内容不足一屏时无法触发滚动
    setTimeout(() => {
      handleScroll();
    }, 100);

    return () => {
      // console.log('清理滚动监听器');
      scrollTarget.removeEventListener('scroll', throttledScroll as any);
    };
  }, [handleScroll, containerRef]);
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
