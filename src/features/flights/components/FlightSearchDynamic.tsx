"use client";

import dynamic from "next/dynamic";

// 动态导入 FlightSearch 组件，实现代码分割
const FlightSearch = dynamic(() => import("./FlightSearch"), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
    </div>
  ),
  ssr: true, // 启用服务端渲染
});

export default FlightSearch;
