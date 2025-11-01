import FlightDetailDynamic from "@/features/flights/components/FlightDetailDynamic";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";
import Link from "next/link";
import { getFlightById, getFlights } from "@/server/flights/server";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const flights = await getFlights();

  return flights.map((flight) => ({
    id: flight._id.toString(),
  }));
}

export default async function FlightDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data, success } = await getFlightById(id);

  if (!success) {
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

  const serializedFlight = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "object" && value?._bsontype === "ObjectID"
        ? value.toString()
        : value
    )
  );

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
      <main>{data && <FlightDetailDynamic flight={serializedFlight} />}</main>
    </div>
  );
}
