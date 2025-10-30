"use client";

import { useState } from "react";
import { IFlight } from "@/lib/models/Flight";
import FlightCardSkeleton from "./FlightCardSkeleton";
import FlightSearchDynamic from "./FlightSearchDynamic";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { NetworkError, DataLoadError } from "@/components/ui/error-boundary";
import { withCache, cacheKeys, cacheTTL } from "@/lib/cache";
import OptimizedFlightList from "@/components/ui/optimized-flight-list";
import OptimizedFlightCard from "@/components/ui/optimized-flight-card";

interface FlightListProps {
  initialFlights?: IFlight[];
  initialTotalPages?: number;
}

function FlightList({
  initialFlights = [],
  initialTotalPages = 1,
}: FlightListProps) {
  const [flights, setFlights] = useState<IFlight[]>(initialFlights);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [searchDestination, setSearchDestination] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [error, setError] = useState<string | null>(null);
  const [useOptimizedView, setUseOptimizedView] = useState(true);

  // 创建带缓存的API调用函数
  const fetchFlightsAPI = withCache(
    async (page: number, destination: string, sort: string) => {
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

      return data;
    },
    (page, destination, sort) =>
      cacheKeys.flights(page, 12, { destination, sort }),
    cacheTTL.flights
  );

  const fetchFlights = async (page = 1, destination = "", sort = "price") => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchFlightsAPI(page, destination, sort);

      // 处理新的 API 响应格式
      if (data.success && data.data !== undefined) {
        setFlights(data.data);
        // 如果没有数据，totalPages 应该是 0 或者至少是 1（但要确保正确显示无数据状态）
        const totalPages =
          data.pagination?.totalPages || (data.data.length > 0 ? 1 : 0);
        setTotalPages(Math.max(totalPages, data.data.length > 0 ? 1 : 0));
        setCurrentPage(page);
      } else {
        // 处理旧的 API 响应格式（向后兼容）
        const flights = data.flights || [];
        setFlights(flights);
        setTotalPages(data.totalPages || (flights.length > 0 ? 1 : 0));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
      setError(error instanceof Error ? error.message : "获取航班数据失败");
      // 确保在错误情况下也清空航班列表
      setFlights([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = ({
    destination,
    sortBy: sort,
  }: {
    destination: string;
    sortBy: string;
  }) => {
    setSearchDestination(destination);
    setSortBy(sort);
    fetchFlights(1, destination, sort);
  };

  const handlePageChange = (page: number) => {
    fetchFlights(page, searchDestination, sortBy);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 搜索组件 */}
        <FlightSearchDynamic onSearch={handleSearch} loading={loading} />

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 sm:mb-6">
            {error.includes("网络") ||
            error.includes("Network") ||
            error.includes("fetch") ? (
              <NetworkError
                onRetry={() =>
                  fetchFlights(currentPage, searchDestination, sortBy)
                }
              />
            ) : (
              <DataLoadError
                message={error}
                onRetry={() =>
                  fetchFlights(currentPage, searchDestination, sortBy)
                }
              />
            )}
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="space-y-4 sm:space-y-6">
            {/* 搜索结果标题骨架 */}
            <div className="w-48 h-6 sm:h-7 bg-gray-300 animate-pulse rounded"></div>

            {/* 航班卡片骨架 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <FlightCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* 航班列表 */}
        {!loading && flights.length > 0 && (
          <>
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                找到 {flights.length} 个航班
                {searchDestination && (
                  <span className="text-blue-600 ml-2 block sm:inline text-sm sm:text-base">
                    目的地: {searchDestination}
                  </span>
                )}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseOptimizedView(!useOptimizedView)}
                className="text-xs"
              >
                {useOptimizedView ? "传统视图" : "优化视图"}
              </Button>
            </div>

            {useOptimizedView ? (
              <OptimizedFlightList
                initialFlights={flights}
                enableVirtualization={flights.length > 20}
                enableInfiniteScroll={false}
                itemsPerPage={12}
                containerHeight={800}
                onFlightClick={(flightId) => {
                  window.location.href = `/flights/${flightId}`;
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {flights.map((flight, index) => (
                  <OptimizedFlightCard
                    key={flight._id.toString()}
                    flight={flight}
                    priority={index < 4}
                    lazy={index >= 4}
                  />
                ))}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-1 sm:space-x-2 px-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  <span className="hidden sm:inline">上一页</span>
                  <span className="sm:hidden">上一页</span>
                </Button>

                <div className="flex space-x-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className="text-xs sm:text-sm min-w-8 sm:min-w-10 px-2 sm:px-3"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  <span className="hidden sm:inline">下一页</span>
                  <span className="sm:hidden">下一页</span>
                </Button>
              </div>
            )}
          </>
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

// 使用性能监控HOC包装组件
export default FlightList;
