import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { IFlight, FLIGHT_COLLECTION, validateFlight } from "@/lib/models/Flight";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

// GET - 获取单个航班详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    const flight = await collection.findOne({ _id: new ObjectId(id) });

    if (!flight) {
      return NextResponse.json({ 
        success: false, 
        error: "Flight not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      flight
    });
  } catch (error) {
    console.error("Error fetching flight:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight" },
      { status: 500 }
    );
  }
}

// PUT - 更新航班 (仅管理员)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    const data = await request.json();
    
    // 验证数据
    const validationErrors = validateFlight(data);
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // 添加更新时间
    data.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // 更新页面缓存
    revalidatePath('/');
    revalidatePath('/admin/flights');
    revalidatePath(`/flights/${id}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating flight:", error);
    return NextResponse.json(
      { error: "Failed to update flight" },
      { status: 500 }
    );
  }
}

// PATCH - 部分更新航班 (仅管理员)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    const data = await request.json();
    
    // 对于PATCH请求，只验证提供的字段
    // 添加更新时间
    data.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // 更新页面缓存
    revalidatePath('/');
    revalidatePath('/admin/flights');
    revalidatePath(`/flights/${id}`);

    return NextResponse.json({
      success: true,
      flight: result
    });
  } catch (error) {
    console.error("Error updating flight:", error);
    return NextResponse.json(
      { error: "Failed to update flight" },
      { status: 500 }
    );
  }
}

// DELETE - 删除航班 (仅管理员)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }

    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });

    if (!result) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // 更新页面缓存
    revalidatePath('/');
    revalidatePath('/flights');
    revalidatePath('/admin/flights');

    return NextResponse.json({ message: "Flight deleted successfully" });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { error: "Failed to delete flight" },
      { status: 500 }
    );
  }
}
