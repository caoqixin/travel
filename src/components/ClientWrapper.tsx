"use client";

import { useState, useEffect, ReactNode } from "react";
import Preloader from "@/components/ui/preloader";

interface ClientWrapperProps {
  children: ReactNode;
  showPreloader?: boolean;
}

export default function ClientWrapper({
  children,
  showPreloader = true,
}: ClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(showPreloader);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 模拟应用初始化
    const initializeApp = async () => {
      try {
        // 预加载关键资源
        await Promise.all([
          // 预加载字体
          document.fonts.ready,
          // 等待DOM完全加载
          new Promise((resolve) => {
            if (document.readyState === "complete") {
              resolve(void 0);
            } else {
              window.addEventListener("load", () => resolve(void 0));
            }
          }),
        ]);

        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  const handlePreloaderComplete = () => {
    setIsLoading(false);
  };

  // 如果正在加载且需要显示预加载器
  if (isLoading && showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  // 如果应用还没准备好，显示简单的加载状态
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
