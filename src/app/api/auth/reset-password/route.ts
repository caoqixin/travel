import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { IUser, USER_COLLECTION } from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "令牌和新密码为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为6位" },
        { status: 400 }
      );
    }

    // 连接数据库
    const db = await getDatabase();
    const collection = db.collection<IUser>(USER_COLLECTION);

    // 查找具有有效重置令牌的用户
    const user = await collection.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "无效或已过期的重置令牌" },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 更新用户密码并清除重置令牌
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpiry: "",
        },
      }
    );

    return NextResponse.json({ message: "密码重置成功" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "密码重置失败，请重试" },
      { status: 500 }
    );
  }
}
