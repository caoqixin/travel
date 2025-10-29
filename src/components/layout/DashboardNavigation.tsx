"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Plane,
  ChevronRight,
  ChevronDown,
  List,
  Plus,
} from "lucide-react";

const navigationItems = [
  {
    name: "仪表板",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "总览和统计",
  },
  {
    name: "航班管理",
    href: "/admin/flights",
    icon: Plane,
    description: "航班信息管理",
    hasSubmenu: true,
    submenu: [
      {
        name: "航班列表",
        href: "/admin/flights",
        icon: List,
        description: "查看所有航班",
      },
      {
        name: "添加航班",
        href: "/admin/flights/new",
        icon: Plus,
        description: "创建新航班",
      },
    ],
  },
];

interface DashboardNavigationProps {
  onItemClick?: () => void;
}

export function DashboardNavigation({
  onItemClick,
}: DashboardNavigationProps = {}) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (item: any) => {
    if (item.hasSubmenu) {
      return pathname.startsWith(item.href);
    }
    return pathname === item.href;
  };

  const isSubItemActive = (href: string) => pathname === href;

  return (
    <nav className="w-72 bg-white  border-gray-200">
      <div className="p-6">
        {/* Navigation Links */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            主要功能
          </h2>
          {navigationItems.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name} className="space-y-1">
                {item.hasSubmenu ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-blue-500"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                      ) : (
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-blue-500"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                      )}
                    </div>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive
                            ? "text-blue-500"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                    </div>
                  </Link>
                )}

                {/* Submenu */}
                {item.hasSubmenu && isExpanded && (
                  <div className="ml-4 space-y-1">
                    {item.submenu?.map((subItem: any) => {
                      const isSubActive = isSubItemActive(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={onItemClick}
                          className={`group flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                              isSubActive
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                            }`}
                          >
                            <subItem.icon className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="font-medium">{subItem.name}</p>
                            <p className="text-xs text-gray-500">
                              {subItem.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
