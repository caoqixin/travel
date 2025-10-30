"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Calendar,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IFlight } from "@/lib/models/Flight";
import { ObjectId } from "mongodb";

interface FlightTableProps {
  flights: IFlight[];
  onDeleteFlight: (flightId: ObjectId) => void;
}

export function FlightTable({ flights, onDeleteFlight }: FlightTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
            正常
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 font-medium">
            停用
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 font-medium">
            已取消
          </Badge>
        );
      case "delayed":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium">
            延误
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
            {status}
          </Badge>
        );
    }
  };

  const getSeatUtilization = (available: number, total: number) => {
    const used = total - available;
    const percentage = (used / total) * 100;
    return { used, percentage };
  };

  if (flights.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
            <Plane className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            暂无航班数据
          </h3>
          <p className="text-gray-600 text-center mb-8 max-w-md">
            您还没有添加任何航班。开始创建您的第一个航班来管理您的航空业务。
          </p>
          <Link href="/admin/flights/new">
            <Button className="bg-blue-600 hover:bg-blue-700 px-6 py-3">
              <Plus className="w-4 h-4 mr-2" />
              添加第一个航班
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Plane className="w-6 h-6 mr-2 text-blue-600" />
              最近添加的航班
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">管理和查看您的航班信息</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/flights">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
            <Link href="/admin/flights/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                添加航班
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    航班信息
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm hidden lg:table-cell">
                    路线
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    价格
                  </th>

                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm hidden xl:table-cell">
                    状态
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flights.map((flight, index) => {
                  return (
                    <tr
                      key={flight._id.toString()}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Plane className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {flight.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(
                                new Date(flight.createdAt),
                                "yyyy-MM-dd",
                                {
                                  locale: zhCN,
                                }
                              )}
                            </div>
                            <div className="lg:hidden mt-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-1" />
                                {flight.departure.city} → {flight.arrival.city}
                              </div>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {flight.type === "round-trip" ? "往返" : "单程"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              {flight.departure.city}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(flight.departure.time), "HH:mm")}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="w-12 border-t border-gray-300 relative">
                              <Plane className="w-4 h-4 text-blue-500 absolute -top-2 left-1/2 transform -translate-x-1/2" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              {flight.arrival.city}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(flight.arrival.time), "HH:mm")}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            {flight.type === "round-trip" ? "往返" : "单程"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            €{flight.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">起价</div>
                        </div>
                      </td>

                      <td className="py-4 px-6 hidden xl:table-cell">
                        {getStatusBadge(flight.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <Link href={`/flights/${flight._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/flights/${flight._id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-50"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/flights/${flight._id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  查看详情
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/flights/${flight._id}/edit`}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  编辑航班
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteFlight(flight._id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除航班
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
