"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { IFlight } from "@/lib/models/Flight";
import { EditFlightForm, FlightFormData } from "./EditFlightForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WithId } from "mongodb";

interface EditFlightContainerProps {
  initialFlight: WithId<IFlight>;
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
      // 客户端验证和数据清理
      const validateAndClean = (value: any) => {
        if (typeof value === "string") {
          return value.trim() || undefined;
        }
        return value;
      };

      // 验证必填字段
      const errors: string[] = [];

      if (!validateAndClean(formData.title)) {
        errors.push("航班标题不能为空");
      }
      if (!validateAndClean(formData.flightNumber)) {
        errors.push("航班号不能为空");
      }
      if (!validateAndClean(formData.flightDuration)) {
        errors.push("飞行时长不能为空");
      }
      if (
        !formData.departure?.city ||
        !formData.departure?.airport ||
        !formData.departure?.code ||
        !formData.departure?.time
      ) {
        errors.push("出发信息不完整");
      }
      if (
        !formData.arrival?.city ||
        !formData.arrival?.airport ||
        !formData.arrival?.code ||
        !formData.arrival?.time
      ) {
        errors.push("到达信息不完整");
      }
      if (!formData.airline?.name || !formData.airline?.code) {
        errors.push("航空公司信息不完整");
      }
      if (formData.price !== undefined && formData.price <= 0) {
        errors.push("价格必须大于0");
      }

      // 验证往返航班
      if (formData.type === "round-trip" && formData.returnFlight) {
        if (
          !formData.returnFlight.departure?.city ||
          !formData.returnFlight.departure?.airport ||
          !formData.returnFlight.departure?.code ||
          !formData.returnFlight.departure?.time
        ) {
          errors.push("返程出发信息不完整");
        }
        if (
          !formData.returnFlight.arrival?.city ||
          !formData.returnFlight.arrival?.airport ||
          !formData.returnFlight.arrival?.code ||
          !formData.returnFlight.arrival?.time
        ) {
          errors.push("返程到达信息不完整");
        }
      }

      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      // 转换表单数据为 IFlight 格式
      const { returnFlight, price, ...baseFormData } = formData;

      // 处理价格字段 - 如果折扣价格为0或undefined，则不包含
      const priceData: any = {
        price: price,
      };

      const flightData: Partial<IFlight> = {
        ...baseFormData,
        ...priceData,
        title: validateAndClean(formData.title),
        description: validateAndClean(formData.description),
        image: formData.image || "/images/placeholder.svg", // 提供默认图片
        flightNumber: validateAndClean(formData.flightNumber),
        flightDuration: validateAndClean(formData.flightDuration),
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
        layovers: formData.layovers?.map((layover) => ({
          ...layover,
          terminal: layover.terminal || "",
          arrivalTime: layover.arrivalTime
            ? new Date(layover.arrivalTime)
            : new Date(),
          departureTime: layover.departureTime
            ? new Date(layover.departureTime)
            : new Date(),
        })),
        // 提供默认值
        baggage: formData.baggage || {
          cabin: { weight: "7kg", quantity: 1 },
          checked: { weight: "23kg", quantity: 1 },
        },
        amenities: formData.amenities || [],
        status: formData.status || "active",
        stops: formData.layovers ? formData.layovers.length : 0,
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
