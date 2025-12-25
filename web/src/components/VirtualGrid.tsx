import { useRef, useEffect, useState, useCallback, ReactNode } from "react";

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number; // 每个项目的高度
  itemWidth: number; // 每个项目的宽度
  gap: number; // 项目之间的间距
  overscan?: number; // 预渲染的额外行数
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  containerClassName?: string;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  gap,
  overscan = 3,
  renderItem,
  className = "",
  containerClassName = "",
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // 计算每行可以显示多少个项目
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap)) || 1;

  // 计算总行数
  const totalRows = Math.ceil(items.length / itemsPerRow);

  // 计算容器高度
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  // 计算可视区域高度
  const viewportHeight = containerRef.current?.clientHeight || 0;

  // 计算可视区域内的起始和结束行
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + viewportHeight) / (itemHeight + gap)) + overscan
  );

  // 计算可视区域内的起始和结束索引
  const startIndex = startRow * itemsPerRow;
  const endIndex = Math.min(items.length - 1, (endRow + 1) * itemsPerRow - 1);

  // 计算可视区域内的项目
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // 监听滚动事件
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 添加滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${containerClassName}`}
      style={{ height: "100%" }}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          position: "relative",
        }}
      >
        <div
          className={className}
          style={{
            position: "absolute",
            top: `${startRow * (itemHeight + gap)}px`,
            left: 0,
            right: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${itemsPerRow}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: "center",
          }}
        >
          {visibleItems.map((item, idx) => {
            const actualIndex = startIndex + idx;
            return <div key={actualIndex}>{renderItem(item, actualIndex)}</div>;
          })}
        </div>
      </div>

    </div>
  );
}
