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
      // 数据验证和清理
      const validateAndClean = (value: any, defaultValue: any = "") => {
        return value && value.toString().trim() !== ""
          ? value.toString().trim()
          : defaultValue;
      };

      // 验证必填字段
      const requiredFields = [
        { field: data.title, name: "标题" },
        { field: data.flightNumber, name: "航班号" },
        { field: data.flightDuration, name: "飞行时长" },
        { field: data.departure?.city, name: "出发城市" },
        { field: data.departure?.airport, name: "出发机场" },
        { field: data.departure?.code, name: "出发机场代码" },
        { field: data.departure?.time, name: "出发时间" },
        { field: data.arrival?.city, name: "到达城市" },
        { field: data.arrival?.airport, name: "到达机场" },
        { field: data.arrival?.code, name: "到达机场代码" },
        { field: data.arrival?.time, name: "到达时间" },
        { field: data.airline?.name, name: "航空公司名称" },
        { field: data.airline?.code, name: "航空公司代码" },
      ];

      // 检查必填字段
      for (const { field, name } of requiredFields) {
        if (!field || field.toString().trim() === "") {
          throw new Error(`${name}不能为空`);
        }
      }

      // 验证价格
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        throw new Error("价格必须大于0");
      }

      // 如果是往返航班，验证返程航班信息
      if (data.type === "round-trip") {
        const returnRequiredFields = [
          { field: data.returnFlight?.flightNumber, name: "返程航班号" },
          { field: data.returnFlight?.flightDuration, name: "返程飞行时长" },
          { field: data.returnFlight?.departure?.city, name: "返程出发城市" },
          {
            field: data.returnFlight?.departure?.airport,
            name: "返程出发机场",
          },
          {
            field: data.returnFlight?.departure?.code,
            name: "返程出发机场代码",
          },
          { field: data.returnFlight?.departure?.time, name: "返程出发时间" },
          { field: data.returnFlight?.arrival?.city, name: "返程到达城市" },
          { field: data.returnFlight?.arrival?.airport, name: "返程到达机场" },
          { field: data.returnFlight?.arrival?.code, name: "返程到达机场代码" },
          { field: data.returnFlight?.arrival?.time, name: "返程到达时间" },
        ];

        for (const { field, name } of returnRequiredFields) {
          if (!field || field.toString().trim() === "") {
            throw new Error(`${name}不能为空`);
          }
        }
      }

      // 准备航班数据
      const flightData = {
        title: validateAndClean(data.title),
        description: validateAndClean(data.description),
        image: validateAndClean(data.image, "/placeholder-flight.jpg"), // 提供默认图片
        price: Number(data.price),
        departure: {
          city: validateAndClean(data.departure.city),
          airport: validateAndClean(data.departure.airport),
          code: validateAndClean(data.departure.code),
          terminal: validateAndClean(data.departure.terminal),
          time: new Date(data.departure.time),
        },
        arrival: {
          city: validateAndClean(data.arrival.city),
          airport: validateAndClean(data.arrival.airport),
          code: validateAndClean(data.arrival.code),
          terminal: validateAndClean(data.arrival.terminal),
          time: new Date(data.arrival.time),
        },
        flightNumber: validateAndClean(data.flightNumber),
        flightDuration: validateAndClean(data.flightDuration),
        layovers:
          data.layovers?.map((layover: any) => ({
            city: validateAndClean(layover.city),
            airport: validateAndClean(layover.airport),
            code: validateAndClean(layover.code),
            terminal: validateAndClean(layover.terminal),
            flightNumber: validateAndClean(layover.flightNumber),
            arrivalTime: new Date(layover.arrivalTime || new Date()),
            departureTime: new Date(layover.departureTime || new Date()),
            duration: validateAndClean(layover.duration),
          })) || [],
        returnFlight:
          data.type === "round-trip" && data.returnFlight
            ? {
                departure: {
                  city: validateAndClean(data.returnFlight.departure.city),
                  airport: validateAndClean(
                    data.returnFlight.departure.airport
                  ),
                  code: validateAndClean(data.returnFlight.departure.code),
                  terminal: validateAndClean(
                    data.returnFlight.departure.terminal
                  ),
                  time: new Date(data.returnFlight.departure.time),
                },
                arrival: {
                  city: validateAndClean(data.returnFlight.arrival.city),
                  airport: validateAndClean(data.returnFlight.arrival.airport),
                  code: validateAndClean(data.returnFlight.arrival.code),
                  terminal: validateAndClean(
                    data.returnFlight.arrival.terminal
                  ),
                  time: new Date(data.returnFlight.arrival.time),
                },
                flightNumber: validateAndClean(data.returnFlight.flightNumber),
                flightDuration: validateAndClean(
                  data.returnFlight.flightDuration
                ),
                layovers:
                  data.returnFlight.layovers?.map((layover: any) => ({
                    city: validateAndClean(layover.city),
                    airport: validateAndClean(layover.airport),
                    code: validateAndClean(layover.code),
                    terminal: validateAndClean(layover.terminal),
                    flightNumber: validateAndClean(layover.flightNumber),
                    arrivalTime: new Date(layover.arrivalTime || new Date()),
                    departureTime: new Date(
                      layover.departureTime || new Date()
                    ),
                    duration: validateAndClean(layover.duration),
                  })) || [],
              }
            : undefined,
        type: data.type,
        airline: {
          name: validateAndClean(data.airline.name),
          code: validateAndClean(data.airline.code),
        },
        stops: data.layovers?.length || 0,
        baggage: {
          cabin: {
            weight: validateAndClean(data.baggage?.cabin?.weight, "7kg"),
            quantity: Number(data.baggage?.cabin?.quantity) || 1,
          },
          checked: {
            weight: validateAndClean(data.baggage?.checked?.weight, "23kg"),
            quantity: Number(data.baggage?.checked?.quantity) || 1,
          },
        },
        amenities: data.amenities || [],
        status: data.status || "active",
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
