"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "./DashboardStats";
import { FlightTable } from "../../flights/components/FlightTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IFlight } from "@/lib/models/Flight";
import { ObjectId } from "mongodb";
import { TitleHeader } from "@/components/TitleHeader";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsData {
  totalFlights: number;
  activeFlights: number;
}

interface DashboardContentProps {
  username: string;
}

export function DashboardContent({ username }: DashboardContentProps) {
  const [flights, setFlights] = useState<IFlight[]>([]);
  const [stats, setStats] = useState<DashboardStatsData>({
    totalFlights: 0,
    activeFlights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent flights for display
      const flightsResponse = await fetch("/api/admin/flights?limit=5&sortBy=createdAt&sortOrder=desc");
      const flightsData = await flightsResponse.json();

      if (flightsData.success && flightsData.flights) {
        setFlights(flightsData.flights); // Show recent 5 flights from API
      }

      // Fetch accurate statistics from dedicated stats API
      const statsResponse = await fetch("/api/admin/stats");
      const statsData = await statsResponse.json();

      if (statsData.success && statsData.stats) {
        setStats({
          totalFlights: statsData.stats.totalFlights || 0,
          activeFlights: statsData.stats.activeFlights || 0,
        });
      } else {
        // Fallback to default values if stats API fails
        setStats({
          totalFlights: 0,
          activeFlights: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values on error
      setStats({
        totalFlights: 0,
        activeFlights: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlight = async (flightId: ObjectId) => {
    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFlights(flights.filter((flight) => flight._id !== flightId));
        // Refresh stats
        fetchDashboardData();
      } else {
        console.error("Failed to delete flight");
      }
    } catch (error) {
      console.error("Error deleting flight:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* 标题骨架 */}
            <Skeleton className="h-8 w-1/3" />

            {/* 统计卡片骨架 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            {/* 表格骨架 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <TitleHeader title="仪表板" description={`欢迎回来, ${username}`} />

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Recent Flights */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              最近添加的航班
            </h2>
            <Link href="/admin/flights">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </div>
          <FlightTable flights={flights} onDeleteFlight={handleDeleteFlight} />
        </div>
      </div>
    </div>
  );
}
