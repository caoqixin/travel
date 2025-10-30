import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 检查是否是管理员（可选，如果需要权限控制）
    // const session = await auth.api.getSession({
    //   headers: request.headers,
    // });
    
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    // 清除所有缓存
    cache.clear();
    
    console.log('✅ 应用缓存已清除');
    
    return NextResponse.json({
      success: true,
      message: "缓存已清除",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("清除缓存时出错:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "清除缓存失败",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// 也支持 GET 请求（用于简单测试）
export async function GET(request: NextRequest) {
  try {
    const cacheSize = cache.size();
    
    return NextResponse.json({
      success: true,
      cacheSize,
      message: `当前缓存中有 ${cacheSize} 个条目`
    });
    
  } catch (error) {
    console.error("获取缓存信息时出错:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "获取缓存信息失败"
      },
      { status: 500 }
    );
  }
}