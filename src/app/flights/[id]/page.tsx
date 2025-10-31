import FlightDetailDynamic from "@/features/flights/components/FlightDetailDynamic";
import { Button } from "@/components/ui/button";
import { Plane, ArrowLeft } from "lucide-react";
import { IFlight } from "@/lib/models/Flight";
import Link from "next/link";

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/flights`, {
    cache: "no-store", // 确保获取最新数据
  });

  const flights = await response.json();

  return flights.data.map((flight: IFlight) => ({
    id: flight._id.toString(),
  }));
}

async function getFlight(id: string): Promise<IFlight | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/flights/${id}`, {
      cache: "no-store", // 确保获取最新数据
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.flight as IFlight;
    } else {
      console.error(
        "Failed to fetch flight:",
        data.error || data.message || "Unknown error"
      );
      return null;
    }
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FlightDetailPage({ params }: PageProps) {
  const { id } = await params;
  const flight = await getFlight(id);

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            航班未找到
          </h2>
          <p className="text-gray-600 mb-4">
            抱歉，您查找的航班不存在或已被删除
          </p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              航班详情
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <FlightDetailDynamic flight={flight} />
      </main>
    </div>
  );
}
