import { Suspense } from "react";
import { FlightsList } from "@/features/admin/flights/components/FlightsList";
import { Loader2 } from "lucide-react";
import { TitleHeader } from "@/components/TitleHeader";
import { IFlight } from "@/lib/models/Flight";

// 模拟服务端数据获取函数
async function getFlightsData(): Promise<IFlight[]> {
  try {
    // 在构建时跳过数据获取
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_APP_URL
    ) {
      return [];
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/admin/flights?limit=1000`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const flightsData = await response.json();
    return flightsData.flights || [];
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    </div>
  );
}

export default async function AdminFlightsPage() {
  // 服务端获取初始数据
  const initialFlights = await getFlightsData();

  return (
    <div className="container mx-auto px-4 py-8">
      <TitleHeader title="航班管理" description="管理所有航班信息和状态" />

      <Suspense fallback={<LoadingFallback />}>
        <FlightsList initialFlights={initialFlights} />
      </Suspense>
    </div>
  );
}
