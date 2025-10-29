"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// 动态导入 FlightDetail 组件，实现代码分割
const FlightDetail = dynamic(
  () => import("./FlightDetail"),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">正在加载航班详情...</p>
        </div>
      </div>
    ),
    ssr: true, // 启用服务端渲染
  }
);

export default FlightDetail;