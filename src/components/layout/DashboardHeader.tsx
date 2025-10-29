"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  Plus,
  LogOut,
  Plane,
  Menu,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

interface DashboardHeaderProps {
  user: UserInfo;
  onMenuClick?: () => void;
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const logout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/admin/login");
        },
      },
    });
  };
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden p-2"
            >
              <Menu className="w-6 h-6" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  LunaTech Travel
                </h1>
                <p className="text-sm text-gray-500">管理控制台</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="搜索航班、用户或预订..."
                className="pl-11 pr-4 py-3 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/admin/flights/new">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加航班
                </Button>
              </Link>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-9 h-9 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        管理员
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenuItem
                  className="p-3 text-red-600 focus:text-red-600"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
