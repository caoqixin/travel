"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { IFlight } from "@/lib/models/Flight";

interface FlightCardProps {
  flight: IFlight;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const departureDate = new Date(flight.departure.time);
  const arrivalDate = new Date(flight.arrival.time);

  const discount = flight.discountPrice
    ? Math.round((1 - flight.discountPrice / flight.price) * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
      <div className="relative h-32 sm:h-48 md:h-56">
        <Image
          src={flight.image}
          alt={flight.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
          <Badge
            variant="secondary"
            className="bg-white/90 text-gray-800 text-xs sm:text-sm"
          >
            {flight.type === "round-trip" ? "往返" : "单程"}
          </Badge>
          {discount > 0 && (
            <Badge
              variant="destructive"
              className="bg-red-500 text-xs sm:text-sm"
            >
              {discount}% OFF
            </Badge>
          )}
        </div>
        {flight.tags.length > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge variant="outline" className="bg-white/90 text-xs sm:text-sm">
              {flight.tags[0]}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-1">
            {flight.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
            <Plane className="w-3 h-3 sm:w-4 sm:h-4" />
            {flight.airline.name} ({flight.airline.code})
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* 航班路线 */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="font-semibold text-sm sm:text-lg">
                {flight.departure.code}
              </p>
              <p className="text-xs text-gray-600">{flight.departure.city}</p>
              <p className="text-xs text-gray-500">
                {format(departureDate, "HH:mm", { locale: zhCN })}
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center px-1 sm:px-2">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {flight.flightDuration}
                </span>
              </div>
              <div className="w-full h-px bg-gray-300 relative">
                <Plane className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-1.5 sm:-top-2 left-1/2 transform -translate-x-1/2 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {!flight.layovers || flight.layovers.length === 0
                  ? "直飞"
                  : `${flight.layovers.length}次中转`}
              </p>
            </div>

            <div className="text-center flex-1">
              <p className="font-semibold text-sm sm:text-lg">
                {flight.arrival.code}
              </p>
              <p className="text-xs text-gray-600">{flight.arrival.city}</p>
              <p className="text-xs text-gray-500">
                {format(arrivalDate, "HH:mm", { locale: zhCN })}
              </p>
            </div>
          </div>

          {/* 出发日期 */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">
              {format(departureDate, "yyyy年MM月dd日 EEEE", { locale: zhCN })}
            </span>
          </div>
        </div>

        {/* 价格和预订按钮 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl font-bold text-blue-600">
              €{(flight.discountPrice || flight.price).toLocaleString()}
            </span>
            {flight.discountPrice && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                €{flight.price.toLocaleString()}
              </span>
            )}
          </div>

          <Link href={`/flights/${flight._id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
              查看详情
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
