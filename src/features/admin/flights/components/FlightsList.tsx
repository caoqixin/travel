"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  MapPin,
  Clock,
  Tag,
  Luggage,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { IFlight } from "@/lib/models/Flight";
import { ObjectId } from "mongodb";
import Image from "next/image";

interface FlightsListProps {
  initialFlights?: IFlight[];
}

export function FlightsList({ initialFlights = [] }: FlightsListProps) {
  const [flights, setFlights] = useState<IFlight[]>(initialFlights);
  const [loading, setLoading] = useState(!initialFlights.length);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<ObjectId | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "date" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!initialFlights.length) {
      fetchFlights();
    }
  }, [initialFlights.length]);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      // 使用管理员API端点获取所有航班，不限制数量
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/flights?limit=1000&sortBy=createdAt&sortOrder=desc`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFlights(data.flights || []);
        } else {
          console.error("获取航班列表失败:", data.error);
        }
      } else {
        console.error("获取航班列表失败");
      }
    } catch (error) {
      console.error("获取航班列表错误:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (flightId: ObjectId) => {
    if (!confirm("确定要删除这个航班吗？此操作不可撤销。")) {
      return;
    }

    try {
      setDeleteLoading(flightId);
      const response = await fetch(`/api/admin/flights?id=${flightId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFlights(flights.filter((flight) => flight._id !== flightId));
        } else {
          alert("删除失败：" + data.error);
        }
      } else {
        alert("删除失败，请重试");
      }
    } catch (error) {
      console.error("删除航班错误:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: IFlight["status"]) => {
    const statusMap = {
      active: {
        label: "正常",
        color: "bg-green-100 text-green-800",
      },
      inactive: {
        label: "停用",
        color: "bg-gray-100 text-gray-800",
      },
      "sold-out": {
        label: "售罄",
        color: "bg-red-100 text-red-800",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${statusInfo.color} border-0`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDateTime = (date: Date) => {
    return format(new Date(date), "MM-dd HH:mm", { locale: zhCN });
  };

  // 过滤和排序逻辑
  const filteredAndSortedFlights = useMemo(() => {
    return flights
      .filter((flight) => {
        const matchesSearch =
          flight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flight.departure.city
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          flight.arrival.city
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          flight.airline.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (flight.description &&
            flight.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          flight.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesStatus =
          filterStatus === "all" || flight.status === filterStatus;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price":
            return a.price - b.price;
          case "date":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "status":
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [flights, searchTerm, filterStatus, sortBy]);

  // 分页计算
  const totalItems = filteredAndSortedFlights.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFlights = filteredAndSortedFlights.slice(startIndex, endIndex);

  // 重置页码当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤栏 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索航班标题、出发地、目的地或航空公司..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">所有状态</option>
                <option value="active">正常</option>
                <option value="inactive">停用</option>
                <option value="sold-out">售罄</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "price" | "date" | "status")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="date">按日期排序</option>
                <option value="price">按价格排序</option>
                <option value="status">按状态排序</option>
              </select>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={5}>每页 5 条</option>
                <option value={10}>每页 10 条</option>
                <option value={20}>每页 20 条</option>
                <option value={50}>每页 50 条</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flights.length}</div>
                <p className="text-sm text-gray-600">总航班数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {totalItems !== flights.length && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-sm text-gray-600">筛选结果</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {currentFlights.length}
                </div>
                <p className="text-sm text-gray-600">当前页显示</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {currentPage}/{totalPages}
                </div>
                <p className="text-sm text-gray-600">当前页/总页数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 航班列表 */}
      {currentFlights.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "未找到匹配的航班"
                  : "暂无航班"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== "all"
                  ? "请尝试调整搜索条件或过滤器"
                  : "开始添加您的第一个航班"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Link href="/admin/flights/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    添加航班
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentFlights.map((flight) => {
            return (
              <Card
                key={flight._id.toString()}
                className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* 航班图片 */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {flight.image ? (
                        <Image
                          src={flight.image}
                          alt={flight.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Plane className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* 航班信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {flight.title}
                          </h3>
                          {flight.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {flight.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{flight.airline.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(flight.status)}
                          <Badge variant="outline" className="bg-gray-50">
                            {flight.type === "round-trip" ? "往返" : "单程"}
                          </Badge>
                        </div>
                      </div>

                      {/* 航班详情网格 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        {/* 航线信息 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              {flight.departure.city} → {flight.arrival.city}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {flight.departure.airport} →{" "}
                            {flight.arrival.airport}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(flight.departure.time)} →{" "}
                            {formatDateTime(flight.arrival.time)}
                          </div>
                        </div>

                        {/* 飞行时长和中转 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {flight.flightDuration}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {(flight.layovers?.length || 0) === 0
                              ? "直飞"
                              : `${flight.layovers?.length || 0} 次中转`}
                          </div>
                          {flight.layovers && flight.layovers.length > 0 && (
                            <div className="text-xs text-gray-500">
                              中转:{" "}
                              {flight.layovers.map((l) => l.city).join(", ")}
                            </div>
                          )}
                        </div>

                        {/* 行李和设施 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Luggage className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">行李</span>
                          </div>
                          {flight.baggage.cabin && (
                            <div className="text-xs text-gray-500">
                              手提: {flight.baggage.cabin.weight} (
                              {flight.baggage.cabin.quantity}件)
                            </div>
                          )}
                          {flight.baggage.checked && (
                            <div className="text-xs text-gray-500">
                              托运: {flight.baggage.checked.weight} (
                              {flight.baggage.checked.quantity}件)
                            </div>
                          )}
                        </div>

                        {/* 价格 */}
                        <div className="flex flex-col items-end justify-center">
                          <div className="text-right">
                            {flight.discountPrice ? (
                              <>
                                <div className="text-lg font-bold text-red-600">
                                  €{flight.discountPrice.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  €{flight.price.toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <div className="text-lg font-bold text-blue-600">
                                €{flight.price.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 标签和设施 */}
                      {(flight.tags.length > 0 ||
                        flight.amenities.length > 0) && (
                        <div className="mb-4 space-y-2">
                          {flight.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="h-3 w-3 text-gray-500" />
                              {flight.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {flight.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{flight.tags.length - 3} 更多
                                </span>
                              )}
                            </div>
                          )}
                          {flight.amenities.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Star className="h-3 w-3 text-gray-500" />
                              {flight.amenities
                                .slice(0, 3)
                                .map((amenity, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {amenity}
                                  </Badge>
                                ))}
                              {flight.amenities.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{flight.amenities.length - 3} 更多设施
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 返程信息 */}
                      {flight.type === "round-trip" && flight.returnFlight && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-2">
                            返程航班
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
                            <div>
                              {flight.returnFlight.departure.city} →{" "}
                              {flight.returnFlight.arrival.city}
                            </div>
                            <div>
                              {formatDateTime(
                                flight.returnFlight.departure.time
                              )}{" "}
                              →{" "}
                              {formatDateTime(flight.returnFlight.arrival.time)}
                            </div>
                            {flight.returnFlight && (
                              <div>
                                飞行时长: {flight.returnFlight.flightDuration}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 底部操作栏 */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          创建时间:{" "}
                          {format(
                            new Date(flight.createdAt),
                            "yyyy-MM-dd HH:mm",
                            { locale: zhCN }
                          )}
                          {flight.updatedAt &&
                            new Date(flight.updatedAt).getTime() !==
                              new Date(flight.createdAt).getTime() && (
                              <span className="ml-2">
                                更新:{" "}
                                {format(
                                  new Date(flight.updatedAt),
                                  "yyyy-MM-dd HH:mm",
                                  { locale: zhCN }
                                )}
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/flights/${flight._id}`}>
                            <Button variant="outline" size="sm" className="h-8">
                              <Eye className="h-3 w-3 mr-1" />
                              预览
                            </Button>
                          </Link>
                          <Link href={`/admin/flights/${flight._id}`}>
                            <Button variant="outline" size="sm" className="h-8">
                              <Eye className="h-3 w-3 mr-1" />
                              详情
                            </Button>
                          </Link>
                          <Link href={`/admin/flights/${flight._id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8">
                              <Edit className="h-3 w-3 mr-1" />
                              编辑
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(flight._id)}
                            disabled={deleteLoading === flight._id}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleteLoading === flight._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)}{" "}
                条，共 {totalItems} 条记录
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
