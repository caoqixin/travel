"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FlightCard from "./FlightCard";
import FlightCardSkeleton from "./FlightCardSkeleton";
import FlightSearchDynamic from "./FlightSearchDynamic";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IFlight } from "@/lib/models/Flight";

interface InfiniteFlightListProps {
  initialFlights?: IFlight[];
}

export default function InfiniteFlightList({
  initialFlights = [],
}: InfiniteFlightListProps) {
  const [flights, setFlights] = useState<IFlight[]>(initialFlights);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchDestination, setSearchDestination] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 使用ref存储最新的状态值，避免useEffect依赖问题
  const stateRef = useRef({
    currentPage,
    searchDestination,
    sortBy,
    loadingMore,
    hasMore,
  });

  // 更新ref中的状态值
  stateRef.current = {
    currentPage,
    searchDestination,
    sortBy,
    loadingMore,
    hasMore,
  };

  const fetchFlights = async (
    page = 1,
    destination = "",
    sort = "price",
    append = false
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(destination && { destination }),
        ...(sort && { sortBy: sort }),
      });

      const response = await fetch(`/api/flights?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "获取航班数据失败");
      }

      const newFlights = data.data || [];
      const totalPages = data.pagination?.totalPages || 1;
      const total = data.pagination?.totalItems || 0;

      if (append) {
        setFlights((prev) => [...prev, ...newFlights]);
      } else {
        setFlights(newFlights);
      }

      setCurrentPage(page);
      setHasMore(page < totalPages);
      setTotalCount(total);
    } catch (error) {
      console.error("Error fetching flights:", error);
      setError(error instanceof Error ? error.message : "获取航班数据失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // const loadMore = useCallback(() => {
  //   if (!loadingMore && hasMore) {
  //     fetchFlights(currentPage + 1, searchDestination, sortBy, true);
  //   }
  // }, [currentPage, searchDestination, sortBy, loadingMore, hasMore]);

  // 初始化数据获取 - 只在组件挂载时执行一次
  useEffect(() => {
    // 如果没有初始数据，获取第一页
    if (initialFlights.length === 0) {
      fetchFlights(1, "", "price", false);
    }
  }, []); // 空依赖数组，只在挂载时执行一次

  // 设置无限滚动观察器
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 使用ref中的最新状态值，避免依赖问题
          const {
            currentPage,
            searchDestination,
            sortBy,
            loadingMore,
            hasMore,
          } = stateRef.current;
          if (!loadingMore && hasMore) {
            fetchFlights(currentPage + 1, searchDestination, sortBy, true);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // 移除所有依赖，只在组件挂载时设置一次

  const handleSearch = ({
    destination,
    sortBy: sort,
  }: {
    destination: string;
    sortBy: string;
  }) => {
    setSearchDestination(destination);
    setSortBy(sort);
    setCurrentPage(1);
    setHasMore(true);
    fetchFlights(1, destination, sort, false);
  };

  const handleRetry = () => {
    fetchFlights(currentPage, searchDestination, sortBy, false);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        {/* 搜索组件 */}
        <FlightSearchDynamic onSearch={handleSearch} loading={loading} />

        {/* 错误提示 */}
        {error && (
          <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2 h-6 text-xs"
              >
                重试
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 结果统计 */}
        {!loading && flights.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              找到 {totalCount} 个航班
              {searchDestination && (
                <span className="text-blue-600 ml-2 block sm:inline text-sm sm:text-base">
                  目的地: {searchDestination}
                </span>
              )}
            </h2>
          </div>
        )}

        {/* 初始加载状态 */}
        {loading && flights.length === 0 && (
          <div className="space-y-4 sm:space-y-6">
            {/* 搜索结果标题骨架 */}
            <div className="w-48 h-6 sm:h-7 bg-gray-300 animate-pulse rounded"></div>

            {/* 航班卡片骨架 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
              {Array.from({ length: 12 }, (_, i) => (
                <FlightCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* 航班列表 */}
        {flights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 items-stretch">
            {flights.map((flight, index) => (
              <FlightCard
                key={`${flight._id.toString()}-${index}`}
                flight={flight}
              />
            ))}
          </div>
        )}

        {/* 加载更多指示器 */}
        {hasMore && flights.length > 0 && (
          <div
            ref={loadMoreRef}
            className="flex justify-center items-center py-8"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>加载更多航班...</span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">滚动查看更多航班</div>
            )}
          </div>
        )}

        {/* 加载更多骨架 */}
        {loadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 items-stretch">
            {Array.from({ length: 4 }, (_, i) => (
              <FlightCardSkeleton key={`loading-${i}`} />
            ))}
          </div>
        )}

        {/* 无更多数据 */}
        {!hasMore && flights.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">已显示全部 {flights.length} 个航班</div>
          </div>
        )}

        {/* 无数据状态 */}
        {!loading && flights.length === 0 && !error && (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="text-gray-400 mb-4">
              <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
              暂无航班数据
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              {searchDestination
                ? `未找到前往 "${searchDestination}" 的航班，请尝试其他目的地`
                : "请稍后再试或联系客服"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
