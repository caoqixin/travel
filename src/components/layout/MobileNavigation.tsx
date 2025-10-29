"use client";

import { useState, useEffect } from "react";
import { DashboardNavigation } from "./DashboardNavigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0  bg-opacity-50 z-40"
        onClick={handleBackdropClick}
      />

      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">导航菜单</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 导航内容 */}
        <div className="flex-1 overflow-y-auto">
          <DashboardNavigation onItemClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// 导出一个 Hook 来管理移动端导航状态
export function useMobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const openNav = () => setIsOpen(true);
  const closeNav = () => setIsOpen(false);
  const toggleNav = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openNav,
    closeNav,
    toggleNav,
  };
}
