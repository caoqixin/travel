"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";

interface PreloaderProps {
  onComplete?: () => void;
  minDuration?: number;
}

export default function Preloader({
  onComplete,
  minDuration = 1000,
}: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  useEffect(() => {
    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // 最小显示时间
    const minTimer = setTimeout(() => {
      if (progress >= 100) {
        handleComplete();
      }
    }, minDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minTimer);
    };
  }, [minDuration, progress]);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(handleComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo动画 */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <Plane className="w-10 h-10 text-white animate-bounce" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          LunaTech Travel
        </h1>
        <p className="text-blue-700 mb-8">为您寻找最佳航班</p>

        {/* 进度条 */}
        <div className="w-64 mx-auto">
          <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-blue-600 text-sm mt-2">
            {Math.round(Math.min(progress, 100))}%
          </p>
        </div>

        {/* 加载提示 */}
        <div className="mt-6 text-blue-600 text-sm">
          <div className="flex items-center justify-center space-x-1">
            <span>正在加载</span>
            <div className="flex space-x-1">
              <div
                className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
