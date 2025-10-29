"use client";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardNavigation } from "./DashboardNavigation";
import { MobileNavigation, useMobileNavigation } from "./MobileNavigation";

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

interface ResponsiveDashboardLayoutProps {
  user: UserInfo;
  children: React.ReactNode;
}

export function ResponsiveDashboardLayout({
  user,
  children,
}: ResponsiveDashboardLayoutProps) {
  const { isOpen, openNav, closeNav } = useMobileNavigation();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 固定的Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <DashboardHeader user={user} onMenuClick={openNav} />
      </div>

      {/* 主要内容区域，为Header留出空间 */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* 桌面端导航栏，固定位置 */}
        <div className="hidden lg:block bg-white border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <DashboardNavigation />
        </div>

        {/* 主内容区域，自然流动 */}
        <main className="flex-1 bg-gray-50 lg:ml-64">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* 移动端导航 */}
      <MobileNavigation isOpen={isOpen} onClose={closeNav} />
    </div>
  );
}
