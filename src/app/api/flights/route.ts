import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { IFlight, FLIGHT_COLLECTION, validateFlight, createFlightDefaults } from "@/lib/models/Flight";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { cache, cacheKeys, cacheTTL, withCache } from "@/lib/cache";
import { optimizedFlightQuery } from "@/lib/db-optimization";
import { 
  createOptimizedResponse,
  DataCompressor, 
  PaginationOptimizer
} from "@/lib/response-optimization";

import { 
  withConcurrencyControl, 
  globalRateLimiter 
} from "@/lib/concurrency-optimization";

// 创建带缓存的航班查询函数
const getCachedFlights = withCache(
  async (destination: string | null, sortBy: string, page: number, limit: number) => {
    // 构建查询条件
    const query: any = { status: "active" };
    if (destination) {
      query.$or = [
        { "departure.city": { $regex: destination, $options: "i" } },
        { "arrival.city": { $regex: destination, $options: "i" } },
      ];
    }

    // 构建排序条件
    const sortOptions: any = {};
    if (sortBy === "price") {
      sortOptions.price = 1;
    } else if (sortBy === "departure") {
      sortOptions["departure.time"] = 1;
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
  (destination, sortBy, page, limit) => 
    cacheKeys.flights(page, limit, { destination, sortBy }),
  cacheTTL.flights
);

// 优化的航班查询函数（带并发控制）
const optimizedGetFlights = withConcurrencyControl(
  async (destination: string | null, sortBy: string, page: number, limit: number) => {
    // 使用缓存查询
    const result = await getCachedFlights(destination, sortBy, page, limit);
    
    // 暂时禁用压缩功能，直接使用原始数据
    // const compressedFlights = DataCompressor.compressFlightData(result.flights);
    
    // 创建分页响应
    return PaginationOptimizer.createPaginatedResponse(
      result.flights,
      result.total,
      page,
      limit,
      {
        cached: cache.has(cacheKeys.flights(page, limit, { destination, sortBy })),
        filters: { destination, sortBy }
      }
    );
  },
  {
    useQueue: true,
    useRateLimit: true,
    identifier: (destination, sortBy, page, limit) => 
      `flights:${destination || 'all'}:${sortBy}:${page}:${limit}`
  }
);

// GET - 获取航班列表
export async function GET(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get("destination");
    const sortBy = searchParams.get("sortBy") || "price";
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "10");

    // 获取客户端标识符（用于限流）
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // 检查限流
    const rateLimitKey = `flights-api:${clientId}`;
    if (!globalRateLimiter.isAllowed(rateLimitKey)) {
      const resetTime = globalRateLimiter.getResetTime(rateLimitKey);
      const errorResponse = NextResponse.json(
        { 
          error: "Rate limit exceeded",
          resetTime: new Date(resetTime).toISOString(),
          remaining: globalRateLimiter.getRemainingRequests(rateLimitKey)
        },
        { status: 429 }
      );
      
      // 设置限流头
      errorResponse.headers.set('X-RateLimit-Limit', '1000');
      errorResponse.headers.set('X-RateLimit-Remaining', 
        globalRateLimiter.getRemainingRequests(rateLimitKey).toString());
      errorResponse.headers.set('X-RateLimit-Reset', 
        Math.ceil(resetTime / 1000).toString());
      
      return errorResponse;
    }

    // 优化分页参数
    const { page, limit } = PaginationOptimizer.optimizePagination(rawPage, rawLimit);

    // 参数验证
    if (page < 1 || limit < 1) {
      const errorResponse = NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
      return errorResponse;
    }

    // 执行优化查询
    const result = await optimizedGetFlights(destination, sortBy, page, limit);

    // 创建优化响应
    const response = createOptimizedResponse(result, {
      enableCaching: true,
      cacheMaxAge: 300, // 5分钟缓存
      enableETag: true
    });

    // 添加限流头
    response.headers.set('X-RateLimit-Limit', '1000');
    response.headers.set('X-RateLimit-Remaining', 
      globalRateLimiter.getRemainingRequests(rateLimitKey).toString());

    return response;
  } catch (error) {
    console.error("Error fetching flights:", error);
    
    // 检查是否是限流错误
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      const errorResponse = NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
      return errorResponse;
    }
    
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch flights" },
      { status: 500 }
    );
    return errorResponse;
  }
}

// POST - 创建新航班 (仅管理员)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<IFlight>(FLIGHT_COLLECTION);

    const data = await request.json();
    
    // 验证数据
    const validationErrors = validateFlight(data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // 创建航班数据
    const flightData = createFlightDefaults(data);
    
    const result = await collection.insertOne(flightData);
    const flight = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(flight, { status: 201 });
  } catch (error) {
    console.error("Error creating flight:", error);
    return NextResponse.json(
      { error: "Failed to create flight" },
      { status: 500 }
    );
  }
}
