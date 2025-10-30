import { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlightDetailContainer } from "@/features/admin/flights/components/FlightDetailContainer";
import { IFlight } from "@/lib/models/Flight";

interface FlightDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "航班详情 - 管理后台",
  description: "查看航班详细信息",
};

async function getFlight(id: string): Promise<IFlight | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/api/flights/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success) {
      return data.flight as IFlight;
    } else {
      console.error("Failed to fetch flight:", data.error || "Unknown error");
      return null;
    }
  } catch {
    return null;
  }
}

export default async function AdminFlightDetailPage({
  params,
}: FlightDetailPageProps) {
  const { id } = await params;
  const flight = await getFlight(id);

  if (!flight) {
    notFound();
  }

  return <FlightDetailContainer flight={flight} />;
}
