"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, ArrowRight, Wifi, Coffee, Luggage } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import Link from "next/link";
import { formatFlightTime } from "@/lib/utils";
import { IFlight } from "@/lib/models/Flight";

interface FlightCardProps {
  flight: IFlight;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
      case "wi-fi":
        return <Wifi className="h-3 w-3" />;
      case "餐食":
      case "meal":
        return <Coffee className="h-3 w-3" />;
      case "行李":
      case "baggage":
        return <Luggage className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-linear-to-br from-white to-blue-50/30 border-0 shadow-lg h-full flex flex-col">
      {/* 航班图片 */}
      <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden group bg-gray-100 shrink-0">
        <OptimizedImage
          src={flight.image}
          alt={flight.title}
          width={400}
          height={300}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          preload={false}
        />

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent"></div>

        {/* 价格标签 */}
        <div className="absolute top-3 right-3 bg-linear-to-r from-white to-blue-50 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-white/20">
          {flight.discountPrice ? (
            <div className="text-right">
              <div className="text-xs text-gray-500 line-through">
                €{flight.price.toLocaleString()}
              </div>
              <div className="text-lg font-bold bg-linear-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                €{flight.discountPrice.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              €{flight.price.toLocaleString()}
            </div>
          )}
        </div>

        {/* 航班类型标签 */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={flight.type === "round-trip" ? "default" : "secondary"}
            className={`text-xs px-3 py-1.5 font-medium border-0 ${
              flight.type === "round-trip"
                ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                : "bg-linear-to-r from-gray-600 to-gray-700 text-white shadow-lg"
            }`}
          >
            {flight.type === "round-trip" ? "往返" : "单程"}
          </Badge>
        </div>

        {/* 折扣标签 */}
        {flight.discountPrice && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-linear-to-r from-red-500 to-pink-500 text-white border-0 text-xs px-2 py-1 animate-pulse">
              特价
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 sm:p-5 flex flex-col grow">
        <div className="space-y-4 grow">
          {/* 航班标题 */}
          <h3 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2 group-hover:bg-linear-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
            {flight.title}
          </h3>

          {/* 航空公司信息 */}
          <div className="flex items-center space-x-3 p-2 bg-linear-to-r from-gray-50 to-blue-50 rounded-lg">
            <div className="p-1 bg-white rounded-full shadow-sm">
              <Plane className="w-7 h-7 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {flight.airline.name} ({flight.airline.code})
            </span>
          </div>

          {/* 航班路线信息 */}
          <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <div className="font-bold text-gray-900 text-lg">
                  {formatFlightTime(flight.departure.time instanceof Date ? flight.departure.time.toISOString() : String(flight.departure.time))}
                </div>
                <div className="text-blue-600 font-medium">
                  {flight.departure.city}
                </div>
                <div className="text-gray-500 text-xs font-medium">
                  {flight.departure.code}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center px-3">
                <div className="text-xs text-gray-600 font-medium mb-2">
                  {flight.flightDuration}
                </div>
                <div className="w-full h-0.5 bg-linear-to-r from-blue-400 to-cyan-400 relative rounded-full">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-linear-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Plane className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-white text-xs ${
                      flight.stops === 0
                        ? "bg-linear-to-r from-green-500 to-emerald-500"
                        : "bg-linear-to-r from-orange-500 to-red-500"
                    }`}
                  >
                    {flight.stops === 0 ? "直飞" : `${flight.stops}次中转`}
                  </span>
                </div>
              </div>

              <div className="text-center flex-1">
                <div className="font-bold text-gray-900 text-lg">
                  {formatFlightTime(flight.arrival.time instanceof Date ? flight.arrival.time.toISOString() : String(flight.arrival.time))}
                </div>
                <div className="text-blue-600 font-medium">
                  {flight.arrival.city}
                </div>
                <div className="text-gray-500 text-xs font-medium">
                  {flight.arrival.code}
                </div>
              </div>
            </div>
          </div>

          {/* 便利设施 */}
          {flight.amenities && flight.amenities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">便利设施</h4>
              <div className="flex flex-wrap gap-2">
                {flight.amenities.slice(0, 4).map((amenity, index) => {
                  const icon = getAmenityIcon(amenity);
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-1.5 text-xs text-gray-700 bg-linear-to-r from-white to-gray-50 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      {icon && (
                        <span className="w-3 h-3 shrink-0 text-blue-500">
                          {icon}
                        </span>
                      )}
                      <span className="truncate font-medium">{amenity}</span>
                    </div>
                  );
                })}
                {flight.amenities.length > 4 && (
                  <div className="text-xs text-gray-600 bg-linear-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full font-medium">
                    +{flight.amenities.length - 4}更多
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 标签 */}
          {flight.tags && flight.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">特色标签</h4>
              <div className="flex flex-wrap gap-2">
                {flight.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-linear-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm hover:shadow-md transition-shadow"
                  >
                    {tag}
                  </span>
                ))}
                {flight.tags.length > 3 && (
                  <span className="text-xs bg-linear-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
                    +{flight.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 查看详情按钮 */}
        <Button
          asChild
          className="w-full mt-4 bg-linear-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-blue-700 font-semibold hover:from-blue-500 hover:to-cyan-500 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm py-2 sm:py-2.5"
        >
          <Link
            href={`/flights/${flight._id.toString()}`}
            className="flex items-center justify-center space-x-2"
          >
            <span>查看详情</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
