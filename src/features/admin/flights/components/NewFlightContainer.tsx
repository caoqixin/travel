"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateFlightForm } from "./CreateFlightForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function NewFlightContainer() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // 转换数据格式以匹配 IFlight 接口
      const flightData = {
        title: data.title,
        description: data.description,
        image: data.image,
        price: data.price,
        discountPrice: data.discountPrice,
        departure: {
          city: data.departure.city,
          airport: data.departure.airport,
          code: data.departure.code,
          terminal: data.departure.terminal || "",
          time: new Date(data.departure.time),
        },
        arrival: {
          city: data.arrival.city,
          airport: data.arrival.airport,
          code: data.arrival.code,
          terminal: data.arrival.terminal || "",
          time: new Date(data.arrival.time),
        },
        flightNumber: data.flightNumber,
        flightDuration: data.flightDuration,
        layovers: data.layovers?.map((layover: any) => ({
          city: layover.city,
          airport: layover.airport,
          code: layover.code,
          terminal: layover.terminal || "",
          flightNumber: layover.flightNumber || "",
          arrivalTime: new Date(layover.arrivalTime || new Date()),
          departureTime: new Date(layover.departureTime || new Date()),
          duration: layover.duration,
        })),
        returnFlight: data.returnFlight ? {
          departure: {
            city: data.returnFlight.departure.city,
            airport: data.returnFlight.departure.airport,
            code: data.returnFlight.departure.code,
            terminal: data.returnFlight.departure.terminal || "",
            time: new Date(data.returnFlight.departure.time),
          },
          arrival: {
            city: data.returnFlight.arrival.city,
            airport: data.returnFlight.arrival.airport,
            code: data.returnFlight.arrival.code,
            terminal: data.returnFlight.arrival.terminal || "",
            time: new Date(data.returnFlight.arrival.time),
          },
          flightNumber: data.returnFlight.flightNumber,
          flightDuration: data.returnFlight.flightDuration,
          layovers: data.returnFlight.layovers?.map((layover: any) => ({
            city: layover.city,
            airport: layover.airport,
            code: layover.code,
            terminal: layover.terminal || "",
            flightNumber: layover.flightNumber || "",
            arrivalTime: new Date(layover.arrivalTime || new Date()),
            departureTime: new Date(layover.departureTime || new Date()),
            duration: layover.duration,
          })),
        } : undefined,
        type: data.type,
        airline: {
          name: data.airline.name,
          code: data.airline.code,
        },
        stops: data.layovers?.length || 0,
        baggage: {
          cabin: {
            weight: data.baggage.cabin.weight,
            quantity: data.baggage.cabin.quantity,
          },
          checked: {
            weight: data.baggage.checked.weight,
            quantity: data.baggage.checked.quantity,
          },
        },
        amenities: data.amenities || [],
        status: data.status,
        tags: data.tags || [],
      };

      const response = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flightData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建航班失败");
      }

      const createdFlight = await response.json();

      toast.success("航班创建成功！", {
        description: `航班 "${createdFlight.title}" 已成功创建`,
        icon: <CheckCircle className="h-4 w-4" />,
      });

      // 创建成功后跳转到航班列表
      router.push("/admin/flights");
    } catch (error) {
      console.error("创建航班失败:", error);
      toast.error("创建航班失败", {
        description:
          error instanceof Error ? error.message : "请检查网络连接或稍后重试",
        icon: <AlertCircle className="h-4 w-4" />,
      });
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
            <h1 className="text-3xl font-bold">创建新航班</h1>
            <p className="text-muted-foreground">
              填写航班信息以创建新的航班产品
            </p>
          </div>
        </div>
      </div>

      {/* 表单内容 */}

      <CreateFlightForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
