import InfiniteFlightList from "@/features/flights/components/InfiniteFlightList";
import { Plane } from "lucide-react";
import { IFlight } from "@/lib/models/Flight";
import ClientWrapper from "@/components/ClientWrapper";

async function getInitialFlights() {
  try {
    // 在构建时跳过数据获取
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_APP_URL
    ) {
      return { flights: [], totalPages: 1 };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/flights?page=1&limit=12&sortBy=price`,
      {
        cache: "no-store", // 确保获取最新数据
      }
    );

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return { flights: [], totalPages: 1 };
    }

    const data = await response.json();

    if (data.success && data.data) {
      return {
        flights: data.data as IFlight[],
        totalPages: data.pagination?.totalPages || 1,
      };
    } else {
      console.error(
        "Failed to fetch flights:",
        data.message || "Unknown error"
      );
      return { flights: [], totalPages: 1 };
    }
  } catch {
    return { flights: [], totalPages: 1 };
  }
}

export default async function Home() {
  const { flights } = await getInitialFlights();
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg">
                  <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {appName}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    意大利中国航班价格查询
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-sm text-gray-600">查看航班价格信息</div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-cyan-600">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                意大利 ⇄ 中国
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-blue-100 mt-2">
                  航班价格查询
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-8 sm:mb-10">
                查看我们旅行社提供的航班信息及参考价格，具体价格请联系客服微信咨询
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">价格实惠</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">微信在线咨询</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm">专业旅行社服务</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/5 rounded-full animate-pulse delay-2000"></div>
            <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white/5 rounded-full animate-pulse delay-500"></div>
          </div>
        </section>

        {/* Main Content */}
        <main className="relative -mt-8 sm:-mt-12">
          <div className="bg-white rounded-t-3xl shadow-xl min-h-screen">
            <InfiniteFlightList initialFlights={flights} />
          </div>
        </main>
      </div>
    </ClientWrapper>
  );
}
