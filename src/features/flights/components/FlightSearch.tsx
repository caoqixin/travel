"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Loader2, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface FlightSearchProps {
  onSearch: (params: { destination: string; sortBy: string }) => void;
  loading?: boolean;
}

export default function FlightSearch({
  onSearch,
  loading = false,
}: FlightSearchProps) {
  const [destination, setDestination] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const onSearchRef = useRef(onSearch);
  const isInitialMount = useRef(true);
  const lastSearchParams = useRef({ destination: "", sortBy: "price" });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 更新 onSearch 引用
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 稳定的防抖搜索函数
  const debouncedSearch = useMemo(
    () =>
      debounce(
        (dest: string, sort: string) =>
          onSearchRef.current({ destination: dest, sortBy: sort }),
        500
      ),
    []
  );

  // 立即搜索函数
  const immediateSearch = useCallback((dest: string, sort: string) => {
    // 更新最后搜索参数，防止重复搜索
    lastSearchParams.current = { destination: dest, sortBy: sort };
    onSearchRef.current({ destination: dest, sortBy: sort });
  }, []);

  // 防止重复搜索的函数
  const performSearchIfChanged = useCallback((dest: string, sort: string) => {
    const currentParams = { destination: dest, sortBy: sort };
    const lastParams = lastSearchParams.current;

    // 检查参数是否真的发生了变化
    if (
      currentParams.destination === lastParams.destination &&
      currentParams.sortBy === lastParams.sortBy
    ) {
      return; // 参数没有变化，不执行搜索
    }

    // 清除之前的搜索超时
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 设置新的搜索超时，防止快速连续的状态更新
    searchTimeoutRef.current = setTimeout(() => {
      lastSearchParams.current = currentParams;
      onSearchRef.current(currentParams);
    }, 500); // 100ms 防抖
  }, []);

  // 只有当排序方式改变时才立即搜索（跳过初始挂载）
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    performSearchIfChanged(destination, sortBy);

    // 清理函数
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [sortBy, destination, performSearchIfChanged]);

  const handleSearch = () => {
    immediateSearch(destination, sortBy);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    // 只有当输入内容时才触发防抖搜索，避免空值触发
    if (value.trim()) {
      debouncedSearch(value, sortBy);
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // 排序变化时不需要额外调用，useEffect 会处理
  };

  const resetToDefault = () => {
    setDestination("");
    setSortBy("price");
    immediateSearch("", "price");
  };

  const handleQuickSelect = (city: string) => {
    // 防止重复点击相同的城市
    if (destination === city) {
      return;
    }

    setDestination(city);
  };

  const handleClearDestination = () => {
    setDestination("");
    immediateSearch("", sortBy);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto mb-6 sm:mb-8 lg:mb-10 shadow-lg border-0 bg-linear-to-br from-white to-gray-50/50">
      <CardHeader className="p-4 sm:p-6 lg:p-8 pb-3 sm:pb-4 lg:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 lg:h-8 lg:w-8 text-blue-600" />
            航班价格查询
          </div>
        </CardTitle>
        <p className="text-sm lg:text-base text-gray-600 mt-2 hidden lg:block">
          查询意大利至中国航班价格信息，具体价格请联系客服微信咨询
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 lg:p-8 pt-0 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* 搜索表单 - 桌面端优化布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          {/* 目的地搜索 - 桌面端占更多空间 */}
          <div className="space-y-2 sm:col-span-1 lg:col-span-5">
            <Label
              htmlFor="destination"
              className="text-sm lg:text-base font-medium text-gray-700"
            >
              目的地城市
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
              <Input
                id="destination"
                type="text"
                placeholder="输入中国城市或机场代码（如：北京、PEK）"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="pl-10 lg:pl-12 pr-10 h-10 lg:h-12 text-sm lg:text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {destination && (
                <button
                  onClick={handleClearDestination}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
              )}
            </div>
          </div>

          {/* 排序方式 - 桌面端优化 */}
          <div className="space-y-2 sm:col-span-1 lg:col-span-4">
            <Label
              htmlFor="sortBy"
              className="text-sm lg:text-base font-medium text-gray-700"
            >
              价格排序
            </Label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 lg:h-12 text-sm lg:text-base border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                <SelectValue placeholder="选择排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">价格从低到高</SelectItem>
                <SelectItem value="-price">价格从高到低</SelectItem>
                <SelectItem value="duration">飞行时间</SelectItem>
                <SelectItem value="departure">出发时间</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 搜索和重置按钮 - 桌面端优化 */}
          <div className="flex items-end gap-2 lg:gap-3 sm:col-span-2 lg:col-span-3">
            <div className="flex gap-2 lg:gap-3 w-full">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 px-4 lg:px-6 py-2 lg:py-3 h-10 lg:h-12 text-sm lg:text-base font-medium bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
                    <span className="hidden sm:inline">查询中...</span>
                    <span className="sm:hidden">查询中</span>
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="hidden sm:inline">查询价格</span>
                    <span className="sm:hidden">查询</span>
                  </>
                )}
              </Button>
              <Button
                onClick={resetToDefault}
                variant="outline"
                disabled={loading}
                className="px-3 lg:px-4 py-2 lg:py-3 h-10 lg:h-12 text-sm lg:text-base hover:bg-gray-50 active:scale-95 transition-all duration-200 border-gray-200"
                title="重置搜索条件"
              >
                <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden lg:inline ml-2">重置</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 快速筛选标签 - 桌面端优化 */}
        <div className="pt-3 sm:pt-4 lg:pt-6 border-t border-gray-100">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-4">
            <span className="text-xs sm:text-sm lg:text-base text-gray-600 mb-1 sm:mb-0 w-full sm:w-auto lg:whitespace-nowrap font-medium">
              热门目的地:
            </span>
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {[
                "北京",
                "上海",
                "广州",
                "深圳",
                "成都",
                "温州",
                "西安",
                "重庆",
              ].map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(city)}
                  className={cn(
                    "text-xs lg:text-sm h-7 lg:h-9 px-2 lg:px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 hover:scale-105",
                    destination === city
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : ""
                  )}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>

          {/* 桌面端额外信息 */}
          <div className="hidden lg:block mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">温馨提示：</span>
              <span>价格仅供参考，具体价格和预订请联系客服微信咨询</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
