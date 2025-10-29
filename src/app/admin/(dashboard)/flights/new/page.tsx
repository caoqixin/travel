import { NewFlightContainer } from "@/features/admin/flights/components/NewFlightContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "创建新航班 - 管理后台",
  description: "创建新的航班产品",
};

export default function NewFlightPage() {
  return <NewFlightContainer />;
}
