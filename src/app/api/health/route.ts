import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { cache } from "@/lib/cache";
import {
  globalRequestQueue,
  globalRateLimiter,
  globalConnectionPool,
} from "@/lib/concurrency-optimization";

// 健康检查结果接口
interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    cache: HealthCheck;
    memory: HealthCheck;
    concurrency: HealthCheck;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    requestQueue: any;
    rateLimiter: any;
    connectionPool: any;
  };
}

interface HealthCheck {
  status: "pass" | "warn" | "fail";
  message: string;
  responseTime?: number;
  details?: any;
}

// 检查数据库连接
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const db = await getDatabase();
    await db.admin().ping();

    const responseTime = Date.now() - startTime;

    return {
      status: responseTime < 100 ? "pass" : "warn",
      message:
        responseTime < 100
          ? "Database connection healthy"
          : "Database connection slow",
      responseTime,
      details: {
        responseTime: `${responseTime}ms`,
      },
    };
  } catch (error) {
    return {
      status: "fail",
      message: "Database connection failed",
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// 检查缓存系统
async function checkCache(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    const testKey = "health-check-test";
    const testValue = { timestamp: Date.now() };

    // 测试缓存写入
    cache.set(testKey, testValue, 10);

    // 测试缓存读取
    const retrieved = cache.get(testKey);

    // 清理测试数据
    cache.delete(testKey);

    const responseTime = Date.now() - startTime;

    if (retrieved && retrieved.timestamp === testValue.timestamp) {
      return {
        status: "pass",
        message: "Cache system healthy",
        responseTime,
        details: {
          responseTime: `${responseTime}ms`,
        },
      };
    } else {
      return {
        status: "fail",
        message: "Cache read/write test failed",
        responseTime,
      };
    }
  } catch (error) {
    return {
      status: "fail",
      message: "Cache system error",
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// 检查内存使用情况
function checkMemory(): HealthCheck {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  let status: "pass" | "warn" | "fail" = "pass";
  let message = "Memory usage normal";

  if (memoryUsagePercent > 90) {
    status = "fail";
    message = "Critical memory usage";
  } else if (memoryUsagePercent > 75) {
    status = "warn";
    message = "High memory usage";
  }

  return {
    status,
    message,
    details: {
      usedMemory: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
      totalMemory: `${(totalMemory / 1024 / 1024).toFixed(2)}MB`,
      usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`,
    },
  };
}

// 检查并发控制系统
function checkConcurrency(): HealthCheck {
  const queueStatus = globalRequestQueue.getStatus();
  const poolStatus = globalConnectionPool.getStatus();

  let status: "pass" | "warn" | "fail" = "pass";
  let message = "Concurrency systems healthy";

  // 检查队列长度
  if (queueStatus.queueLength > 100) {
    status = "fail";
    message = "Request queue overloaded";
  } else if (queueStatus.queueLength > 50) {
    status = "warn";
    message = "Request queue building up";
  }

  // 检查连接池使用率
  const poolUsagePercent = (poolStatus.inUse / poolStatus.total) * 100;
  if (poolUsagePercent > 90) {
    status = "fail";
    message = "Connection pool exhausted";
  } else if (poolUsagePercent > 75) {
    status = status === "fail" ? "fail" : "warn";
    message = status === "fail" ? message : "High connection pool usage";
  }

  return {
    status,
    message,
    details: {
      requestQueue: queueStatus,
      connectionPool: poolStatus,
      poolUsagePercent: `${poolUsagePercent.toFixed(2)}%`,
    },
  };
}

// GET - 健康检查
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 并行执行所有检查
    const [databaseCheck, cacheCheck] = await Promise.all([
      checkDatabase(),
      checkCache(),
    ]);

    const memoryCheck = checkMemory();
    const concurrencyCheck = checkConcurrency();

    // 确定整体状态
    const checks = [databaseCheck, cacheCheck, memoryCheck, concurrencyCheck];
    const hasFailures = checks.some((check) => check.status === "fail");
    const hasWarnings = checks.some((check) => check.status === "warn");

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (hasFailures) {
      overallStatus = "unhealthy";
    } else if (hasWarnings) {
      overallStatus = "degraded";
    } else {
      overallStatus = "healthy";
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: databaseCheck,
        cache: cacheCheck,
        memory: memoryCheck,
        concurrency: concurrencyCheck,
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        requestQueue: globalRequestQueue.getStatus(),
        rateLimiter: {
          // 不暴露具体的限流数据，只提供状态
          active: true,
          type: "sliding-window",
        },
        connectionPool: globalConnectionPool.getStatus(),
      },
    };

    const responseTime = Date.now() - startTime;

    // 根据状态设置HTTP状态码
    const httpStatus =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
        ? 200
        : 503;

    const response = NextResponse.json(result, { status: httpStatus });

    // 添加健康检查头
    response.headers.set("X-Health-Check-Time", `${responseTime}ms`);
    response.headers.set("X-Health-Status", overallStatus);
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );

    return response;
  } catch  {

    const errorResult: HealthCheckResult = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      checks: {
        database: { status: "fail", message: "Health check failed" },
        cache: { status: "fail", message: "Health check failed" },
        memory: { status: "fail", message: "Health check failed" },
        concurrency: { status: "fail", message: "Health check failed" },
      },
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        requestQueue: { error: "Unable to fetch status" },
        rateLimiter: { error: "Unable to fetch status" },
        connectionPool: { error: "Unable to fetch status" },
      },
    };

    return NextResponse.json(errorResult, { status: 503 });
  }
}
