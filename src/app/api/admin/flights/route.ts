import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { IFlight, FLIGHT_COLLECTION } from "@/lib/models/Flight";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { cache, cacheKeys, cacheTTL, withCache } from "@/lib/cache";
import { optimizedFlightQuery } from "@/lib/db-optimization";
import { headers } from "next/headers";

// 创建带缓存的管理员航班查询函数
const getCachedAdminFlights = withCache(
  async (
    status: string | null,
    sortBy: string,
    page: number,
    limit: number
  ) => {
    // 构建查询条件
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // 构建排序条件
    const sortOptions: any = {};
    if (sortBy === "price") {
      sortOptions.price = 1;
    } else if (sortBy === "departure") {
      sortOptions["departure.time"] = 1;
    } else if (sortBy === "createdAt") {
      sortOptions.createdAt = -1;
    } else if (sortBy === "-price") {
      sortOptions.price = -1;
    }

    // 使用优化的查询函数
    const result = await optimizedFlightQuery(query, {
      page,
      limit,
      sort: sortOptions,
    });

    return {
      flights: result.results,
      total: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  },
  (status, sortBy, page, limit) =>
    cacheKeys.adminFlights(page, limit, { status, sortBy }),
  cacheTTL.adminFlights
);

// GET - 获取所有航班列表 (管理员专用)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";

    // 参数验证
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // 使用缓存查询
    const result = await getCachedAdminFlights(status, sortBy, page, limit);

    return NextResponse.json({
      success: true,
      flights: result.flights,
      pagination: {
        page: result.currentPage,
        limit,
        total: result.total,
        pages: result.totalPages,
      },
      cached: cache.has(
        cacheKeys.adminFlights(page, limit, { status, sortBy })
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch flights" },
      { status: 500 }
    );
  }
}

// PUT - 更新航班状态 (管理员专用)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);

    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get("id");

    if (!flightId) {
      return NextResponse.json(
        { error: "Flight ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { status } = data;

    if (
      !status ||
      !["active", "inactive", "cancelled", "completed"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(flightId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    const updatedFlight = await collection.findOne({
      _id: new ObjectId(flightId),
    });

    // 更新页面缓存
    revalidatePath("/");
    revalidatePath("/admin/flights");
    revalidatePath(`/flights/${flightId}`);

    return NextResponse.json({
      success: true,
      flight: updatedFlight,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update flight" },
      { status: 500 }
    );
  }
}

// DELETE - 删除航班 (管理员专用)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);

    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get("id");

    if (!flightId) {
      return NextResponse.json(
        { error: "Flight ID is required" },
        { status: 400 }
      );
    }

    const result = await collection.deleteOne({ _id: new ObjectId(flightId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // 更新页面缓存
    revalidatePath("/");
    revalidatePath("/admin/flights");

    return NextResponse.json({
      success: true,
      message: "Flight deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete flight" },
      { status: 500 }
    );
  }
}
