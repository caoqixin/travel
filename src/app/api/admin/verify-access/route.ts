import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessKey } = await request.json();

    // 从环境变量获取正确的访问密钥
    const correctAccessKey = process.env.ADMIN_ACCESS_KEY;

    if (!correctAccessKey) {
      return NextResponse.json(
        { success: false, message: "服务器配置错误" },
        { status: 500 }
      );
    }

    // 验证访问密钥
    const isValid = accessKey === correctAccessKey;

    if (isValid) {
      return NextResponse.json({ success: true, message: "访问密钥验证成功" });
    } else {
      return NextResponse.json(
        { success: false, message: "访问密钥错误" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
