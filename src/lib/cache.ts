// 简单的内存缓存实现
class MemoryCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

// 创建全局缓存实例
export const cache = new MemoryCache();

// 缓存装饰器函数
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000 // 默认5分钟
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // 尝试从缓存获取
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    try {
      // 执行原函数
      const result = await fn(...args);
      // 缓存结果
      cache.set(key, result, ttl);
      return result;
    } catch (error) {
      // 不缓存错误结果
      throw error;
    }
  }) as T;
}

// 预定义的缓存键生成器
export const cacheKeys = {
  flights: (page: number = 1, limit: number = 10, filters?: any) =>
    `flights:${page}:${limit}:${JSON.stringify(filters || {})}`,

  flightDetail: (id: string) => `flight:${id}`,

  searchResults: (query: string, filters?: any) =>
    `search:${query}:${JSON.stringify(filters || {})}`,

  adminFlights: (page: number = 1, limit: number = 50, filters?: any) =>
    `admin:flights:${page}:${limit}:${JSON.stringify(filters || {})}`,

  flightCount: (filters?: any) =>
    `flight:count:${JSON.stringify(filters || {})}`,

  popularDestinations: () => `destinations:popular`,

  flightStats: () => `flights:stats`,
};

// 缓存配置
export const cacheTTL = {
  flights: 2 * 60 * 1000, // 2分钟 (减少缓存时间，确保数据及时更新)
  flightDetail: 5 * 60 * 1000, // 5分钟 (航班详情也需要及时更新)
  searchResults: 3 * 60 * 1000, // 3分钟 (搜索结果缓存时间减少)
  adminFlights: 1 * 60 * 1000, // 1分钟 (管理员数据需要快速更新)
  flightCount: 10 * 60 * 1000, // 10分钟 (总数统计缓存时间减少)
} as const;
