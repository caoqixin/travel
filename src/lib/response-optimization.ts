import { NextResponse } from 'next/server';

// 响应优化配置
interface OptimizationConfig {
  enableCompression?: boolean;
  enableCaching?: boolean;
  cacheMaxAge?: number;
  enableETag?: boolean;
  enableGzip?: boolean;
}

// 默认优化配置
const defaultConfig: OptimizationConfig = {
  enableCompression: true,
  enableCaching: true,
  cacheMaxAge: 300, // 5分钟
  enableETag: true,
  enableGzip: true
};

// 创建优化的响应
export function createOptimizedResponse(
  data: any,
  config: OptimizationConfig = {}
): NextResponse {
  const finalConfig = { ...defaultConfig, ...config };
  
  // 创建响应
  const response = NextResponse.json(data);
  
  // 设置缓存头
  if (finalConfig.enableCaching) {
    response.headers.set(
      'Cache-Control',
      `public, max-age=${finalConfig.cacheMaxAge}, s-maxage=${finalConfig.cacheMaxAge}`
    );
  }
  
  // 注释掉压缩头设置，因为我们没有实际压缩响应体
  // if (finalConfig.enableCompression) {
  //   response.headers.set('Content-Encoding', 'gzip');
  // }
  
  // 设置ETag
  if (finalConfig.enableETag) {
    const etag = generateETag(data);
    response.headers.set('ETag', etag);
  }
  
  // 设置性能相关头
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// 生成ETag
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return `"${Math.abs(hash).toString(16)}"`;
}

// 响应时间优化装饰器
export function withResponseOptimization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: OptimizationConfig
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const responseTime = Date.now() - startTime;
      
      // 创建优化的响应
      const response = createOptimizedResponse(result, config);
      
      // 添加性能头
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Timestamp', new Date().toISOString());
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // 错误响应也要优化
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      
      errorResponse.headers.set('X-Response-Time', `${responseTime}ms`);
      errorResponse.headers.set('X-Error', 'true');
      
      return errorResponse;
    }
  };
}

// 数据压缩工具
export class DataCompressor {
  // 压缩大型数组数据
  static compressArray<T>(data: T[], maxItems = 100): {
    items: T[];
    compressed: boolean;
    originalCount: number;
    compressedCount: number;
  } {
    if (data.length <= maxItems) {
      return {
        items: data,
        compressed: false,
        originalCount: data.length,
        compressedCount: data.length
      };
    }
    
    return {
      items: data.slice(0, maxItems),
      compressed: true,
      originalCount: data.length,
      compressedCount: maxItems
    };
  }
  
  // 压缩对象数据（移除不必要的字段）
  static compressObject<T extends Record<string, any>>(
    obj: T,
    keepFields: (keyof T)[]
  ): Partial<T> {
    const compressed: Partial<T> = {};
    
    keepFields.forEach(field => {
      if (field in obj) {
        compressed[field] = obj[field];
      }
    });
    
    return compressed;
  }
  
  // 压缩航班数据
  static compressFlightData(flights: any[]) {
    return flights.map(flight => ({
      _id: flight._id,
      flightNumber: flight.flightNumber,
      departure: {
        city: flight.departure.city,
        time: flight.departure.time
      },
      arrival: {
        city: flight.arrival.city,
        time: flight.arrival.time
      },
      price: flight.price,
      status: flight.status,
      availableSeats: flight.availableSeats
    }));
  }
}

// 分页优化工具
export class PaginationOptimizer {
  // 优化分页查询
  static optimizePagination(page: number, limit: number) {
    // 限制每页最大数量
    const maxLimit = 100;
    const optimizedLimit = Math.min(limit, maxLimit);
    
    // 确保页码有效
    const optimizedPage = Math.max(1, page);
    
    return {
      page: optimizedPage,
      limit: optimizedLimit,
      skip: (optimizedPage - 1) * optimizedLimit
    };
  }
  
  // 创建分页响应
  static createPaginatedResponse<T>(
    items: T[],
    totalCount: number,
    page: number,
    limit: number,
    additionalData?: Record<string, any>
  ) {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      ...additionalData
    };
  }
}

// 缓存优化工具
export class CacheOptimizer {
  // 生成缓存键
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
  
  // 设置缓存头
  static setCacheHeaders(response: NextResponse, maxAge = 300) {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
    response.headers.set('Vary', 'Accept-Encoding');
    
    return response;
  }
  
  // 检查缓存是否过期
  static isCacheExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl * 1000;
  }
}