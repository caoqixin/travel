"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import {
  Plane,
  Clock,
  Luggage,
  Wifi,
  Coffee,
  ArrowLeft,
  Tag,
  Route,
  Shield,
  Star,
  Phone,
  Mail,
  Globe,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import { IFlight } from "@/lib/models/Flight";
import { useState } from "react";
import Image from "next/image";
import { WithId } from "mongodb";

interface FlightDetailProps {
  flight: WithId<IFlight>;
}

export default function FlightDetail({ flight }: FlightDetailProps) {
  const [selectedTab, setSelectedTab] = useState<"outbound" | "return">(
    "outbound"
  );
  const [showQRCode, setShowQRCode] = useState(false);

  const handleBookingClick = () => {
    // 检测是否为移动设备
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;

    if (isMobile) {
      // 移动端拨打电话
      window.location.href = "tel:3314238522";
    } else {
      // 桌面端显示微信二维码
      setShowQRCode(true);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, "HH:mm", { locale: zhCN });
    } catch {
      return timeString;
    }
  };

  const formatDate = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, "yyyy年MM月dd日 EEEE", { locale: zhCN });
    } catch {
      return timeString;
    }
  };

  const formatDateTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, "MM月dd日 HH:mm", { locale: zhCN });
    } catch {
      return timeString;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
      case "wi-fi":
        return <Wifi className="h-4 w-4" />;
      case "餐食":
      case "meal":
        return <Coffee className="h-4 w-4" />;
      case "行李":
      case "baggage":
        return <Luggage className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const renderFlightRoute = (
    departure: any,
    arrival: any,
    layovers?: any[],
    duration?: string
  ) => (
    <div className="space-y-4">
      {/* 主要路线 - 响应式布局 */}
      <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
        {/* 移动端垂直布局 */}
        <div className="flex flex-col sm:hidden space-y-4">
          {/* 出发信息 */}
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {formatTime(departure.time)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {departure.city}
            </div>
            <div className="text-xs text-gray-500">
              {departure.airport} ({departure.code})
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(departure.time)}
            </div>
          </div>

          {/* 飞行信息 */}
          <div className="flex flex-col items-center py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-px bg-blue-300"></div>
              <Plane className="h-5 w-5 text-blue-500 mx-2 rotate-90" />
              <div className="w-12 h-px bg-blue-300"></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {layovers && layovers.length > 0
                ? `${layovers.length}次中转`
                : "直飞"}
            </div>
          </div>

          {/* 到达信息 */}
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {formatTime(arrival.time)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {arrival.city}
            </div>
            <div className="text-xs text-gray-500">
              {arrival.airport} ({arrival.code})
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(arrival.time)}
            </div>
          </div>
        </div>

        {/* 桌面端水平布局 */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">
              {formatTime(departure.time)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {departure.city}
            </div>
            <div className="text-xs text-gray-500">
              {departure.airport} ({departure.code})
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(departure.time)}
            </div>
          </div>

          <div className="flex flex-col items-center px-4 lg:px-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center">
              <div className="w-12 lg:w-16 h-px bg-blue-300"></div>
              <Plane className="h-5 w-5 text-blue-500 mx-2" />
              <div className="w-12 lg:w-16 h-px bg-blue-300"></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {layovers && layovers.length > 0
                ? `${layovers.length}次中转`
                : "直飞"}
            </div>
          </div>

          <div className="text-center flex-1">
            <div className="text-xl lg:text-2xl font-bold text-blue-600">
              {formatTime(arrival.time)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {arrival.city}
            </div>
            <div className="text-xs text-gray-500">
              {arrival.airport} ({arrival.code})
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(arrival.time)}
            </div>
          </div>
        </div>
      </div>

      {/* 中转信息 */}
      {layovers && layovers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5" />
              中转信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {layovers.map((layover, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{layover.city}</div>
                  <div className="text-sm text-gray-600">
                    {layover.airport} ({layover.code})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {formatDateTime(layover.arrivalTime)} -{" "}
                    {formatDateTime(layover.departureTime)}
                  </div>
                  <div className="text-xs text-gray-500">
                    中转时间: {layover.duration}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-sm sm:text-base hover:bg-gray-100 hover:text-blue-600 active:scale-95 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">返回航班列表</span>
              <span className="sm:hidden">返回</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 航班头图和基本信息 */}
            <Card className="overflow-hidden shadow-xl border-0 bg-linear-to-br from-white to-blue-50">
              <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={flight.image}
                  alt={flight.title}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                  priority={true}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                {/* 浮动装饰元素 */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm animate-pulse"></div>
                <div className="absolute top-8 right-8 w-8 h-8 bg-white/5 rounded-full backdrop-blur-sm animate-pulse delay-1000"></div>

                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                  <div className="backdrop-blur-sm bg-black/20 rounded-2xl p-4 sm:p-6 border border-white/20">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      {flight.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/30">
                        <Plane className="h-4 w-4 text-blue-200" />
                        <span className="font-medium">
                          {flight.airline.name}
                        </span>
                      </div>
                      <Badge
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 ${
                          flight.type === "round-trip"
                            ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                            : "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        }`}
                      >
                        {flight.type === "round-trip" ? "往返" : "单程"}
                      </Badge>
                      <Badge
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 shadow-lg ${
                          flight.status === "active"
                            ? "bg-linear-to-r from-green-500 to-emerald-500 text-white"
                            : flight.status === "sold-out"
                            ? "bg-linear-to-r from-red-500 to-pink-500 text-white"
                            : "bg-linear-to-r from-gray-500 to-gray-600 text-white"
                        }`}
                      >
                        {flight.status === "active"
                          ? "可预订"
                          : flight.status === "sold-out"
                          ? "已售罄"
                          : "暂停销售"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {flight.description && (
                <CardContent className="p-4 sm:p-6">
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {flight.description}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* 航班路线信息 */}
            <Card className="shadow-lg border-0 bg-linear-to-br from-white to-cyan-50 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 bg-linear-to-r from-blue-500 to-cyan-500 rounded-full">
                      <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                      航班路线
                    </span>
                  </CardTitle>
                  {flight.type === "round-trip" && flight.returnFlight && (
                    <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-blue-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTab("outbound")}
                        className={`text-sm sm:text-base transition-all duration-300 rounded-lg ${
                          selectedTab === "outbound"
                            ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                            : "hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        去程
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTab("return")}
                        className={`text-sm sm:text-base transition-all duration-300 rounded-lg ${
                          selectedTab === "return"
                            ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                            : "hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        返程
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {selectedTab === "outbound"
                  ? renderFlightRoute(
                      flight.departure,
                      flight.arrival,
                      flight.layovers,
                      flight.flightDuration
                    )
                  : flight.returnFlight &&
                    renderFlightRoute(
                      flight.returnFlight.departure,
                      flight.returnFlight.arrival,
                      flight.returnFlight.layovers,
                      flight.returnFlight.flightDuration
                    )}
              </CardContent>
            </Card>

            {/* 航空公司和飞机信息 */}
            <Card className="shadow-lg border-0 bg-linear-to-br from-white to-purple-50 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className="p-2 bg-linear-to-r from-purple-500 to-pink-500 rounded-full">
                    <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    航空公司信息
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-4 sm:gap-6 p-4 bg-linear-to-r from-white to-purple-50 rounded-xl border border-purple-100 shadow-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 relative shrink-0 p-2 bg-white rounded-full shadow-md flex items-center justify-center">
                    <Plane className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg sm:text-xl text-gray-900 truncate">
                      {flight.airline.name}
                    </div>
                    <div className="text-purple-600 font-medium text-sm sm:text-base">
                      航空公司代码: {flight.airline.code}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 行李和设施 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* 行李信息 */}
              <Card className="shadow-lg border-0 bg-linear-to-br from-white to-orange-50 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-orange-500 to-yellow-500 rounded-full">
                      <Luggage className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="bg-linear-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent font-bold">
                      行李规定
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  {flight.baggage.cabin && (
                    <div className="p-3 bg-linear-to-r from-white to-orange-50 rounded-lg border border-orange-100 shadow-sm">
                      <div className="text-orange-600 text-xs sm:text-sm font-medium mb-1">
                        手提行李
                      </div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        {flight.baggage.cabin.weight} (
                        {flight.baggage.cabin.quantity}件)
                      </div>
                    </div>
                  )}
                  {flight.baggage.checked && (
                    <div className="p-3 bg-linear-to-r from-white to-yellow-50 rounded-lg border border-yellow-100 shadow-sm">
                      <div className="text-yellow-600 text-xs sm:text-sm font-medium mb-1">
                        托运行李
                      </div>
                      <div className="font-bold text-gray-900 text-sm sm:text-base">
                        {flight.baggage.checked.weight} (
                        {flight.baggage.checked.quantity}件)
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 机上设施 */}
              <Card className="shadow-lg border-0 bg-linear-to-br from-white to-green-50 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-green-500 to-emerald-500 rounded-full">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                      机上设施
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {flight.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-linear-to-r from-white to-green-50 rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="shrink-0 text-green-600">
                          {getAmenityIcon(amenity)}
                        </span>
                        <span className="truncate font-medium text-gray-900 text-xs sm:text-sm">
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 标签 */}
            {flight.tags.length > 0 && (
              <Card className="shadow-lg border-0 bg-linear-to-br from-white to-indigo-50 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full">
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                      航班特色
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap gap-3">
                    {flight.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="px-3 py-2 bg-linear-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-4 sm:space-y-6">
            {/* 价格和预订 */}
            <Card className="lg:sticky lg:top-4 shadow-xl border-0 bg-linear-to-br from-white to-blue-50 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                  <div className="p-2 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                    价格信息
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="text-center p-4 bg-linear-to-r from-white to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                  <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    €{flight.price.toLocaleString()}
                  </div>
                </div>

                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-gray-400 disabled:hover:to-gray-400"
                  disabled={flight.status !== "active"}
                  onClick={
                    flight.status === "active" ? handleBookingClick : undefined
                  }
                >
                  {flight.status === "active"
                    ? "立即预订"
                    : flight.status === "sold-out"
                    ? "已售罄"
                    : "暂停销售"}
                </Button>

                {/* 微信二维码弹窗 */}
                {showQRCode && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowQRCode(false)}
                  >
                    <div
                      className="bg-white p-6 rounded-lg max-w-sm mx-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-semibold">
                          扫描二维码添加微信咨询
                        </h3>
                        <div className="flex justify-center">
                          <Image
                            src="/images/wechat-qr.svg"
                            alt="微信二维码"
                            width={200}
                            height={200}
                            className="border border-gray-200 rounded"
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          微信号：3314238522
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setShowQRCode(false)}
                          className="w-full"
                        >
                          关闭
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 联系信息 */}
            <Card className="shadow-lg border-0 bg-linear-to-br from-white to-gray-50 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 bg-linear-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <CardTitle className="text-base sm:text-lg flex items-center gap-3">
                  <div className="p-2 bg-linear-to-r from-gray-500 to-slate-500 rounded-full">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="bg-linear-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent font-bold">
                    需要帮助？
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-linear-to-r from-white to-blue-50 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      联系电话
                    </div>
                    <div className="text-xs text-gray-600">
                      3314238522（微信同号）
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-linear-to-r from-white to-green-50 rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Mail className="h-4 w-4 text-green-600 shrink-0" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      邮箱
                    </div>
                    <div className="text-xs text-gray-600 break-all">
                      lunariparazione@gmail.com
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-linear-to-r from-white to-purple-50 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Clock className="h-4 w-4 text-purple-600 shrink-0" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      在线时间
                    </div>
                    <div className="text-xs text-gray-600">
                      每天 9:30 - 20:00
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
