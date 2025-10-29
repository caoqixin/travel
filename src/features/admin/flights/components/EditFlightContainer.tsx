"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { IFlight } from "@/lib/models/Flight";
import { EditFlightForm, FlightFormData } from "./EditFlightForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditFlightContainerProps {
  initialFlight: IFlight;
}

export function EditFlightContainer({
  initialFlight,
}: EditFlightContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleSubmit = async (formData: FlightFormData) => {
    setIsLoading(true);
    try {
      // 转换表单数据为 IFlight 格式
      const { returnFlight, ...baseFormData } = formData;
      const flightData: Partial<IFlight> = {
        ...baseFormData,
        // 确保时间字段是 Date 对象
        departure: {
          ...formData.departure,
          terminal: formData.departure.terminal || "",
          time: new Date(formData.departure.time),
        },
        arrival: {
          ...formData.arrival,
          terminal: formData.arrival.terminal || "",
          time: new Date(formData.arrival.time),
        },
        // 处理中转信息
        layovers: formData.layovers?.map(layover => ({
          ...layover,
          terminal: layover.terminal || "",
          arrivalTime: new Date(), // 默认时间，实际应该从表单获取
          departureTime: new Date(), // 默认时间，实际应该从表单获取
        })),
      };

      // 处理返程信息
      if (formData.type === "round-trip" && formData.returnFlight) {
        flightData.returnFlight = {
          departure: {
            ...formData.returnFlight.departure,
            terminal: formData.returnFlight.departure.terminal || "",
            time: new Date(formData.returnFlight.departure.time),
          },
          arrival: {
            ...formData.returnFlight.arrival,
            terminal: formData.returnFlight.arrival.terminal || "",
            time: new Date(formData.returnFlight.arrival.time),
          },
          flightNumber:
            formData.returnFlight.flightNumber || formData.flightNumber + "R",
          flightDuration:
            formData.returnFlight.flightDuration || formData.flightDuration,
        };
      }

      const response = await fetch(`/api/flights/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flightData),
      });

      if (!response.ok) {
        throw new Error("Failed to update flight");
      }

      toast.success("航班更新成功");
      router.push(`/admin/flights/${params.id}`);
    } catch (error) {
      console.error("Error updating flight:", error);
      toast.error("更新航班失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/flights");
  };
  return (
    <div className="space-y-6 p-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回航班列表</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">编辑航班</h1>
            <p className="text-muted-foreground">{initialFlight.title}</p>
          </div>
        </div>
      </div>
      <EditFlightForm
        flight={initialFlight}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
