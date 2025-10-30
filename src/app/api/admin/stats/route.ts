import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { FLIGHT_COLLECTION } from "@/lib/models/Flight";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection(FLIGHT_COLLECTION);

    // 使用聚合管道获取准确的统计数据
    const stats = await collection
      .aggregate([
        {
          $group: {
            _id: null,
            totalFlights: { $sum: 1 },
            activeFlights: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            inactiveFlights: {
              $sum: {
                $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
              },
            },
            soldOutFlights: {
              $sum: {
                $cond: [{ $eq: ["$status", "sold-out"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    // 如果没有航班数据，返回默认值
    const result =
      stats.length > 0
        ? stats[0]
        : {
            totalFlights: 0,
            activeFlights: 0,
            inactiveFlights: 0,
            soldOutFlights: 0,
          };

    // 移除 _id 字段
    delete result._id;

    return NextResponse.json({
      success: true,
      stats: result,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
