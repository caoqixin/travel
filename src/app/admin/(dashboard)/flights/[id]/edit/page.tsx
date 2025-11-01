import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditFlightContainer } from "@/features/admin/flights/components/EditFlightContainer";
import { getFlightById, getFlights } from "@/server/flights/server";

interface EditFlightPageProps {
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

export const metadata: Metadata = {
  title: "编辑航班 - 管理后台",
  description: "编辑航班信息",
};

export default async function EditFlightPage({ params }: EditFlightPageProps) {
  const { id } = await params;
  const { data, success } = await getFlightById(id);

  if (!success) {
    notFound();
  }

  const serializedFlight = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "object" && value?._bsontype === "ObjectID"
        ? value.toString()
        : value
    )
  );

  return data && <EditFlightContainer initialFlight={serializedFlight} />;
}
