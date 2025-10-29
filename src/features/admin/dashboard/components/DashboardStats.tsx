"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalFlights: number;
    activeFlights: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const dashboardstats = [
    {
      title: "总航班数",
      value: stats.totalFlights,
      icon: Plane,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      // change: "+12%",
      // changeType: "increase",
      // description: "较上月增长",
    },
    {
      title: "活跃航班",
      value: stats.activeFlights,
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      // change: "+8%",
      // changeType: "increase",
      // description: "当前运营中",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {dashboardstats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card
            key={index}
            className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg"
          >
            <div
              className={`absolute inset-0 bg-linear-to-br ${stat.bgGradient} opacity-50`}
            />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div
                      className={`p-3 rounded-xl bg-linear-to-r ${stat.gradient} shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
