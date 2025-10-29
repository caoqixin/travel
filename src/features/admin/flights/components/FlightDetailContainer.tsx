"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Luggage,
  Wifi,
  Coffee,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Image from "next/image";
import { toast } from "sonner";
import { IFlight } from "@/lib/models/Flight";

interface FlightDetailContainerProps {
  flight: IFlight;
}

export function FlightDetailContainer({ flight }: FlightDetailContainerProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个航班吗？此操作不可撤销。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flights/${flight._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast.success("航班删除成功");
      router.push("/admin/flights");
    } catch (error) {
      console.error("删除航班失败:", error);
      toast.error("删除航班失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">可预订</Badge>;
      case "sold-out":
        return <Badge className="bg-red-100 text-red-800">售罄</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">停用</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatTime = (time: Date | string) => {
    const date = typeof time === "string" ? new Date(time) : time;
    return format(date, "HH:mm", { locale: zhCN });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/flights">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{flight.title}</h1>
          {getStatusBadge(flight.status)}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/flights/${flight._id}`}>
              <Eye className="h-4 w-4 mr-2" />
              预览
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/flights/${flight._id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            删除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plane className="h-5 w-5 mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {flight.image && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                  <Image
                    src={flight.image}
                    alt={flight.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{flight.title}</h3>
                <p className="text-gray-600 mt-2">{flight.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-2xl font-bold text-blue-600">
                    €{flight.price.toLocaleString()}
                  </span>
                  {flight.discountPrice &&
                    flight.discountPrice < flight.price && (
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        €{flight.discountPrice.toLocaleString()}
                      </span>
                    )}
                </div>
                <Badge variant="outline">
                  {flight.type === "one-way" ? "单程" : "往返"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 航班信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                航班信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 出发到达信息 */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatTime(flight.departure.time)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flight.departure.city}
                  </div>
                  <div className="text-xs text-gray-500">
                    {flight.departure.airport} ({flight.departure.code})
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <Plane className="h-4 w-4 text-gray-400" />
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatTime(flight.arrival.time)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {flight.arrival.city}
                  </div>
                  <div className="text-xs text-gray-500">
                    {flight.arrival.airport} ({flight.arrival.code})
                  </div>
                </div>
              </div>

              {/* 经停信息 */}
              {flight.layovers && flight.layovers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">经停信息</h4>
                  <div className="space-y-2">
                    {flight.layovers.map((layover, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {layover.city} ({layover.code}) - {layover.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 返程信息 */}
              {flight.type === "round-trip" && flight.returnFlight && (
                <div>
                  <h4 className="font-semibold mb-4">返程信息</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {formatTime(flight.returnFlight.departure.time)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.returnFlight.departure.city}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.returnFlight.departure.airport} (
                        {flight.returnFlight.departure.code})
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <Plane className="h-4 w-4 text-gray-400 transform rotate-180" />
                        <div className="h-px bg-gray-300 flex-1"></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {formatTime(flight.returnFlight.arrival.time)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.returnFlight.arrival.city}
                      </div>
                      <div className="text-xs text-gray-500">
                        {flight.returnFlight.arrival.airport} (
                        {flight.returnFlight.arrival.code})
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 航空公司信息 */}
          <Card>
            <CardHeader>
              <CardTitle>航空公司</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                  <Plane className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">{flight.airline.name}</div>
                  <div className="text-sm text-gray-600">
                    {flight.airline.code}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 行李信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Luggage className="h-5 w-5 mr-2" />
                行李信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {flight.baggage.cabin && (
                <div className="flex justify-between">
                  <span className="text-gray-600">随身行李:</span>
                  <span>
                    {flight.baggage.cabin.weight} (
                    {flight.baggage.cabin.quantity}件)
                  </span>
                </div>
              )}
              {flight.baggage.checked && (
                <div className="flex justify-between">
                  <span className="text-gray-600">托运行李:</span>
                  <span>
                    {flight.baggage.checked.weight} (
                    {flight.baggage.checked.quantity}件)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 其他信息 */}
          <Card>
            <CardHeader>
              <CardTitle>其他信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">飞行时长:</span>
                <span>{flight.flightDuration}</span>
              </div>
              {flight.returnFlight && (
                <div className="flex justify-between">
                  <span className="text-gray-600">返程时长:</span>
                  <span>{flight.returnFlight.flightDuration}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">经停次数:</span>
                <span>{flight.layovers?.length || 0}次</span>
              </div>
            </CardContent>
          </Card>

          {/* 服务设施 */}
          {flight.amenities && flight.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>服务设施</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {flight.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 标签 */}
          {flight.tags && flight.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {flight.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
