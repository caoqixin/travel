import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditFlightContainer } from "@/features/admin/flights/components/EditFlightContainer";
import { IFlight } from "@/lib/models/Flight";

interface EditFlightPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "编辑航班 - 管理后台",
  description: "编辑航班信息",
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
  } catch (error) {
    console.error("Error fetching flight:", error);
    return null;
  }
}

export default async function EditFlightPage({ params }: EditFlightPageProps) {
  const { id } = await params;
  const flight = await getFlight(id);

  if (!flight) {
    notFound();
  }

  return <EditFlightContainer initialFlight={flight} />;
}
