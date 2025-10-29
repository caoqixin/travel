'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 偏移量
  const offsetY = visibleRange.startIndex * itemHeight;

  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 无限滚动虚拟列表
interface InfiniteVirtualListProps<T> extends Omit<VirtualListProps<T>, 'onScroll'> {
  hasMore: boolean;
  loadMore: () => void;
  threshold?: number;
}

export function InfiniteVirtualList<T>({
  hasMore,
  loadMore,
  threshold = 200,
  ...props
}: InfiniteVirtualListProps<T>) {
  const handleScroll = useCallback((scrollTop: number) => {
    const { containerHeight, items, itemHeight } = props;
    const totalHeight = items.length * itemHeight;
    const scrollBottom = scrollTop + containerHeight;
    
    if (hasMore && totalHeight - scrollBottom < threshold) {
      loadMore();
    }
  }, [hasMore, loadMore, threshold, props]);

  return <VirtualList {...props} onScroll={handleScroll} />;
}

// 网格虚拟化组件
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  overscan = 5,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算列数
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);
  
  // 计算可见行范围
  const rowHeight = itemHeight + gap;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    rowsCount - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );
  
  // 可见项目
  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number; row: number; col: number }> = [];
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnsCount; col++) {
        const index = row * columnsCount + col;
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            row,
            col
          });
        }
      }
    }
    
    return result;
  }, [items, startRow, endRow, columnsCount]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  const totalHeight = rowsCount * rowHeight;
  const offsetY = startRow * rowHeight;
  
  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsCount}, ${itemWidth}px)`,
            gap: `${gap}px`
          }}
        >
          {visibleItems.map(({ item, index, row, col }) => (
            <div key={index}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}