"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlightCardSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-0">
        {/* 航班图片骨架 */}
        <div className="relative h-40 sm:h-48 md:h-56">
          <Skeleton className="w-full h-full rounded-t-lg" />
          {/* 价格标签骨架 */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 rounded-lg px-2 sm:px-3 py-1 sm:py-2 shadow-lg">
            <Skeleton className="w-16 sm:w-20 h-4 sm:h-5" />
            <Skeleton className="w-12 sm:w-16 h-3 sm:h-4 mt-1" />
          </div>
          
          {/* 航班类型标签骨架 */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <Skeleton className="w-12 sm:w-16 h-6 sm:h-7 rounded-full" />
          </div>
        </div>

        {/* 航班信息骨架 */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {/* 标题和航空公司骨架 */}
          <div className="space-y-1 sm:space-y-2">
            <Skeleton className="w-3/4 h-5 sm:h-6" />
            <Skeleton className="w-1/2 h-4" />
          </div>

          {/* 航班路线骨架 */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center space-y-1">
                <Skeleton className="w-12 h-5 sm:h-6 mx-auto" />
                <Skeleton className="w-16 h-3 sm:h-4 mx-auto" />
                <Skeleton className="w-8 h-3 mx-auto" />
              </div>
              
              <div className="flex-1 flex flex-col items-center px-2 sm:px-4 space-y-1">
                <Skeleton className="w-16 h-3 sm:h-4" />
                <div className="w-full flex items-center">
                  <Skeleton className="flex-1 h-px" />
                  <Skeleton className="w-4 h-4 rounded mx-1 sm:mx-2" />
                  <Skeleton className="flex-1 h-px" />
                </div>
                <Skeleton className="w-12 h-3" />
              </div>
              
              <div className="flex-1 text-center space-y-1">
                <Skeleton className="w-12 h-5 sm:h-6 mx-auto" />
                <Skeleton className="w-16 h-3 sm:h-4 mx-auto" />
                <Skeleton className="w-8 h-3 mx-auto" />
              </div>
            </div>
            
            {/* 日期骨架 */}
            <Skeleton className="w-20 h-3 sm:h-4 mx-auto" />
          </div>

          {/* 设施和标签骨架 */}
          <div className="space-y-2">
            {/* 设施图标骨架 */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-12 h-6 rounded-full" />
              <Skeleton className="w-14 h-6 rounded-full" />
            </div>
            
            {/* 标签骨架 */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="w-12 h-5" />
              <Skeleton className="w-16 h-5" />
            </div>
          </div>

          {/* 查看详情按钮骨架 */}
          <Skeleton className="w-full h-9 sm:h-10 mt-3 sm:mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}