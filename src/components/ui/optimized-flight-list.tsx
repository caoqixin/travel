'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { VirtualGrid, InfiniteVirtualList } from './virtual-list';
import OptimizedFlightCard from './optimized-flight-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Loader2, 
  RefreshCw,
  Grid,
  List,
  Settings
} from 'lucide-react';
import { IFlight } from '@/lib/models/Flight';
import { useDebounce } from '@/hooks/useDebounce';

interface OptimizedFlightListProps {
  initialFlights?: IFlight[];
  onFlightClick?: (flightId: string) => void;
  enableVirtualization?: boolean;
  enableInfiniteScroll?: boolean;
  itemsPerPage?: number;
  containerHeight?: number;
  className?: string;
}

type SortOption = 'price-asc' | 'price-desc' | 'time-asc' | 'time-desc' | 'duration-asc' | 'duration-desc';
type ViewMode = 'grid' | 'list';

const OptimizedFlightList: React.FC<OptimizedFlightListProps> = ({
  initialFlights = [],
  onFlightClick,
  enableVirtualization = true,
  enableInfiniteScroll = false,
  itemsPerPage = 20,
  containerHeight = 600,
  className = ''
}) => {
  // 状态管理
  const [flights, setFlights] = useState<IFlight[]>(initialFlights);
  const [filteredFlights, setFilteredFlights] = useState<IFlight[]>(initialFlights);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  
  // 防抖搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 获取航空公司列表
  const airlines = useMemo(() => {
    const airlineSet = new Set(flights.map(flight => flight.airline.name));
    return Array.from(airlineSet);
  }, [flights]);

  // 价格范围
  const priceExtent = useMemo((): [number, number] => {
    if (flights.length === 0) return [0, 50000];
    const prices = flights.map(f => f.discountPrice || f.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [flights]);

  // 过滤和排序逻辑
  const processedFlights = useMemo(() => {
    let result = [...flights];

    // 搜索过滤
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(flight =>
        flight.title.toLowerCase().includes(term) ||
        flight.departure.city.toLowerCase().includes(term) ||
        flight.arrival.city.toLowerCase().includes(term) ||
        flight.airline.name.toLowerCase().includes(term)
      );
    }

    // 价格过滤
    result = result.filter(flight => {
      const price = flight.discountPrice || flight.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // 航空公司过滤
    if (selectedAirlines.length > 0) {
      result = result.filter(flight => 
        selectedAirlines.includes(flight.airline.name)
      );
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.discountPrice || a.price) - (b.discountPrice || b.price);
        case 'price-desc':
          return (b.discountPrice || b.price) - (a.discountPrice || a.price);
        case 'time-asc':
          return new Date(a.departure.time).getTime() - new Date(b.departure.time).getTime();
        case 'time-desc':
          return new Date(b.departure.time).getTime() - new Date(a.departure.time).getTime();
        case 'duration-asc':
          return (a.flightDuration || '').localeCompare(b.flightDuration || '');
        case 'duration-desc':
          return (b.flightDuration || '').localeCompare(a.flightDuration || '');
        default:
          return 0;
      }
    });

    return result;
  }, [flights, debouncedSearchTerm, priceRange, selectedAirlines, sortBy]);

  // 分页数据
  const paginatedFlights = useMemo(() => {
    if (enableInfiniteScroll) {
      return processedFlights.slice(0, currentPage * itemsPerPage);
    }
    return processedFlights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [processedFlights, currentPage, itemsPerPage, enableInfiniteScroll]);

  // 更新过滤结果
  useEffect(() => {
    setFilteredFlights(paginatedFlights);
    setHasMore(processedFlights.length > currentPage * itemsPerPage);
  }, [paginatedFlights, processedFlights.length, currentPage, itemsPerPage]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  // 刷新数据
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // 这里可以调用API重新获取数据
      // const response = await fetch('/api/flights');
      // const newFlights = await response.json();
      // setFlights(newFlights);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to refresh flights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 重置过滤器
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSortBy('price-asc');
    setPriceRange(priceExtent);
    setSelectedAirlines([]);
    setCurrentPage(1);
  }, [priceExtent]);

  // 渲染航班卡片
  const renderFlightCard = useCallback((flight: IFlight, index: number) => (
    <OptimizedFlightCard
      key={flight._id.toString()}
      flight={flight}
      onCardClick={onFlightClick}
      priority={index < 4} // 前4个卡片优先加载
      lazy={index >= 4}
    />
  ), [onFlightClick]);

  // 计算网格参数
  const gridParams = useMemo(() => {
    const cardWidth = viewMode === 'grid' ? 320 : containerWidth;
    const cardHeight = viewMode === 'grid' ? 480 : 200;
    const gap = 16;
    
    return {
      itemWidth: cardWidth,
      itemHeight: cardHeight,
      gap
    };
  }, [viewMode, containerWidth]);

  return (
    <div ref={containerRef} className={`space-y-6 ${className}`}>
      {/* 搜索和过滤控件 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* 搜索栏 */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索航班、城市或航空公司..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>

            {/* 过滤和排序控件 */}
            <div className="flex flex-wrap gap-4 items-center">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">价格：低到高</SelectItem>
                  <SelectItem value="price-desc">价格：高到低</SelectItem>
                  <SelectItem value="time-asc">时间：早到晚</SelectItem>
                  <SelectItem value="time-desc">时间：晚到早</SelectItem>
                  <SelectItem value="duration-asc">时长：短到长</SelectItem>
                  <SelectItem value="duration-desc">时长：长到短</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={resetFilters}>
                重置过滤器
              </Button>
            </div>

            {/* 结果统计 */}
            <div className="text-sm text-gray-600">
              找到 {processedFlights.length} 个航班
              {debouncedSearchTerm && ` (搜索: "${debouncedSearchTerm}")`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 航班列表 */}
      <div className="min-h-[400px]">
        {loading && filteredFlights.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>加载中...</span>
          </div>
        ) : filteredFlights.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">未找到航班</h3>
                <p>请尝试调整搜索条件或过滤器</p>
              </div>
            </CardContent>
          </Card>
        ) : enableVirtualization ? (
          enableInfiniteScroll ? (
            <InfiniteVirtualList
              items={filteredFlights}
              itemHeight={gridParams.itemHeight}
              containerHeight={containerHeight}
              renderItem={renderFlightCard}
              hasMore={hasMore}
              loadMore={loadMore}
              loading={loading}
              loadingComponent={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载更多...</span>
                </div>
              }
            />
          ) : (
            <VirtualGrid
              items={filteredFlights}
              itemWidth={gridParams.itemWidth}
              itemHeight={gridParams.itemHeight}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              renderItem={renderFlightCard}
              gap={gridParams.gap}
            />
          )
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredFlights.map((flight, index) => renderFlightCard(flight, index))}
          </div>
        )}
      </div>

      {/* 分页控件 (非无限滚动模式) */}
      {!enableInfiniteScroll && processedFlights.length > itemsPerPage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedFlights.length)} 条，
                共 {processedFlights.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  {currentPage} / {Math.ceil(processedFlights.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= processedFlights.length}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizedFlightList;