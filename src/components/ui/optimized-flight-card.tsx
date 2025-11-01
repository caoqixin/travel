"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane,
  ArrowRight,
  Wifi,
  Coffee,
  Luggage,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { IFlight } from "@/lib/models/Flight";

interface OptimizedFlightCardProps {
  flight: IFlight;
  onCardClick?: (flightId: string) => void;
  priority?: boolean;
  lazy?: boolean;
}

// 航班卡片组件 - 使用 React.memo 优化
const OptimizedFlightCard = memo<OptimizedFlightCardProps>(
  ({ flight, onCardClick, priority = false, lazy = true }) => {
    // 缓存计算结果
    const flightInfo = useMemo(() => {
      return {
        price: flight.price,
        isRoundTrip: flight.type === "round-trip",
      };
    }, [flight.price, flight.type]);

    // 设施图标映射
    const amenityIcons = useMemo(() => {
      const iconMap: Record<string, React.ReactNode> = {
        wifi: <Wifi className="h-3 w-3" />,
        "wi-fi": <Wifi className="h-3 w-3" />,
        餐食: <Coffee className="h-3 w-3" />,
        meal: <Coffee className="h-3 w-3" />,
        行李: <Luggage className="h-3 w-3" />,
        baggage: <Luggage className="h-3 w-3" />,
      };

      return (
        flight.amenities?.slice(0, 3).map((amenity, index) => ({
          icon: iconMap[amenity.toLowerCase()] || null,
          name: amenity,
          key: `${amenity}-${index}`,
        })) || []
      );
    }, [flight.amenities]);

    // 航班时间格式化
    const timeInfo = useMemo(() => {
      const formatTime = (dateTime: string | Date) => {
        return new Date(dateTime).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return {
        departureTime: formatTime(flight.departure.time),
        arrivalTime: formatTime(flight.arrival.time),
        duration: flight.flightDuration || "未知",
      };
    }, [flight.departure.time, flight.arrival.time, flight.flightDuration]);

    // 点击处理
    const handleCardClick = useCallback(() => {
      onCardClick?.(flight._id.toString());
    }, [onCardClick, flight._id]);

    // 图片错误处理
    const handleImageError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
      },
      []
    );

    return (
      <Card
        className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white border border-gray-200 h-full flex flex-col cursor-pointer"
        onClick={handleCardClick}
      >
        {/* 航班图片区域 */}
        <div className="relative h-48 overflow-hidden bg-linear-to-br from-blue-50 to-indigo-100">
          {flight.image ? (
            <Image
              src={flight.image}
              alt={flight.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={lazy ? "lazy" : "eager"}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-l-to-br from-blue-500 to-indigo-600">
              <Plane className="w-16 h-16 text-white opacity-80" />
            </div>
          )}

          {/* 价格标签 */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="text-lg font-bold text-blue-600">
              € {flightInfo.price.toLocaleString()}
            </div>
          </div>

          {/* 航班类型标签 */}
          <div className="absolute top-3 left-3">
            <Badge
              variant={flightInfo.isRoundTrip ? "default" : "secondary"}
              className="text-xs font-medium"
            >
              {flightInfo.isRoundTrip ? "往返" : "单程"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col grow">
          {/* 航班标题 */}
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {flight.title}
          </h3>

          {/* 航空公司信息 */}
          <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Plane className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-sm">{flight.airline.name}</div>
              <div className="text-xs text-gray-500">{flight.airline.code}</div>
            </div>
          </div>

          {/* 航班路线 */}
          <div className="flex items-center justify-between mb-4 p-3 bg-l-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-center">
              <div className="font-bold text-lg">{timeInfo.departureTime}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {flight.departure.city}
              </div>
              <div className="text-xs text-gray-500">
                {flight.departure.code}
              </div>
            </div>

            <div className="flex flex-col items-center px-4">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-8 h-px bg-gray-300"></div>
                <Plane className="w-4 h-4" />
                <div className="w-8 h-px bg-gray-300"></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeInfo.duration}
              </div>
            </div>

            <div className="text-center">
              <div className="font-bold text-lg">{timeInfo.arrivalTime}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {flight.arrival.city}
              </div>
              <div className="text-xs text-gray-500">{flight.arrival.code}</div>
            </div>
          </div>

          {/* 设施信息 */}
          {amenityIcons.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">设施:</span>
              {amenityIcons.map(({ icon, name, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-1 text-xs text-gray-600"
                >
                  {icon}
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* 标签 */}
          {flight.tags && flight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {flight.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {flight.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{flight.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 底部按钮 */}
          <div className="mt-auto pt-4">
            <Link href={`/flights/${flight._id}`} className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                查看详情
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
);

OptimizedFlightCard.displayName = "OptimizedFlightCard";

export default OptimizedFlightCard;
