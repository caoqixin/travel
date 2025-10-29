// 并发控制和优化工具

// 请求队列管理器
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
  }

  // 添加请求到队列
  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  // 处理队列
  private async processQueue() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const task = this.queue.shift();
    
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('Queue task error:', error);
      } finally {
        this.processing--;
        this.processQueue(); // 处理下一个任务
      }
    }
  }

  // 获取队列状态
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      maxConcurrent: this.maxConcurrent
    };
  }

  // 清空队列
  clear() {
    this.queue = [];
  }
}

// 限流器
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) { // 默认每分钟100个请求
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  // 检查是否允许请求
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // 清理过期的请求记录
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // 记录新请求
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  // 获取剩余请求数
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  // 获取重置时间
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }

  // 清理过期记录
  cleanup() {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// 连接池管理器
export class ConnectionPool {
  private connections: Array<{ id: string; inUse: boolean; lastUsed: number }> = [];
  private maxConnections: number;
  private idleTimeout: number;

  constructor(maxConnections = 20, idleTimeout = 300000) { // 5分钟空闲超时
    this.maxConnections = maxConnections;
    this.idleTimeout = idleTimeout;
  }

  // 获取连接
  async getConnection(): Promise<string> {
    // 查找空闲连接
    let connection = this.connections.find(conn => !conn.inUse);
    
    if (!connection && this.connections.length < this.maxConnections) {
      // 创建新连接
      connection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inUse: false,
        lastUsed: Date.now()
      };
      this.connections.push(connection);
    }
    
    if (!connection) {
      throw new Error('No available connections');
    }
    
    connection.inUse = true;
    connection.lastUsed = Date.now();
    
    return connection.id;
  }

  // 释放连接
  releaseConnection(connectionId: string) {
    const connection = this.connections.find(conn => conn.id === connectionId);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  // 清理空闲连接
  cleanupIdleConnections() {
    const now = Date.now();
    this.connections = this.connections.filter(conn => {
      return conn.inUse || (now - conn.lastUsed) < this.idleTimeout;
    });
  }

  // 获取连接池状态
  getStatus() {
    const inUse = this.connections.filter(conn => conn.inUse).length;
    return {
      total: this.connections.length,
      inUse,
      available: this.connections.length - inUse,
      maxConnections: this.maxConnections
    };
  }
}

// 负载均衡器
export class LoadBalancer {
  private servers: Array<{ id: string; weight: number; currentLoad: number; healthy: boolean }> = [];
  private currentIndex = 0;

  // 添加服务器
  addServer(id: string, weight = 1) {
    this.servers.push({
      id,
      weight,
      currentLoad: 0,
      healthy: true
    });
  }

  // 获取下一个服务器（轮询算法）
  getNextServer(): string | null {
    const healthyServers = this.servers.filter(server => server.healthy);
    
    if (healthyServers.length === 0) {
      return null;
    }
    
    const server = healthyServers[this.currentIndex % healthyServers.length];
    this.currentIndex++;
    
    return server.id;
  }

  // 获取最少负载的服务器
  getLeastLoadedServer(): string | null {
    const healthyServers = this.servers.filter(server => server.healthy);
    
    if (healthyServers.length === 0) {
      return null;
    }
    
    const server = healthyServers.reduce((min, current) => 
      current.currentLoad < min.currentLoad ? current : min
    );
    
    return server.id;
  }

  // 增加服务器负载
  increaseLoad(serverId: string) {
    const server = this.servers.find(s => s.id === serverId);
    if (server) {
      server.currentLoad++;
    }
  }

  // 减少服务器负载
  decreaseLoad(serverId: string) {
    const server = this.servers.find(s => s.id === serverId);
    if (server && server.currentLoad > 0) {
      server.currentLoad--;
    }
  }

  // 标记服务器健康状态
  setServerHealth(serverId: string, healthy: boolean) {
    const server = this.servers.find(s => s.id === serverId);
    if (server) {
      server.healthy = healthy;
    }
  }

  // 获取负载均衡状态
  getStatus() {
    return {
      servers: this.servers.map(server => ({
        id: server.id,
        weight: server.weight,
        currentLoad: server.currentLoad,
        healthy: server.healthy
      })),
      totalServers: this.servers.length,
      healthyServers: this.servers.filter(s => s.healthy).length
    };
  }
}

// 批处理管理器
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private batchSize: number;
  private flushInterval: number;
  private processor: (items: T[]) => Promise<R[]>;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize = 10,
    flushInterval = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  // 添加项目到批处理
  async add(item: T): Promise<void> {
    this.batch.push(item);
    
    // 如果达到批处理大小，立即处理
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    } else if (!this.timer) {
      // 设置定时器
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  // 刷新批处理
  async flush(): Promise<R[]> {
    if (this.batch.length === 0) {
      return [];
    }
    
    const items = [...this.batch];
    this.batch = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    try {
      return await this.processor(items);
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  // 获取批处理状态
  getStatus() {
    return {
      currentBatchSize: this.batch.length,
      maxBatchSize: this.batchSize,
      flushInterval: this.flushInterval,
      hasTimer: !!this.timer
    };
  }
}

// 全局实例
export const globalRequestQueue = new RequestQueue(20);
export const globalRateLimiter = new RateLimiter(1000, 60000); // 每分钟1000个请求
export const globalConnectionPool = new ConnectionPool(50, 300000);
export const globalLoadBalancer = new LoadBalancer();

// 定期清理
setInterval(() => {
  globalRateLimiter.cleanup();
  globalConnectionPool.cleanupIdleConnections();
}, 60000); // 每分钟清理一次

// 并发控制装饰器
export function withConcurrencyControl<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    useQueue?: boolean;
    useRateLimit?: boolean;
    identifier?: (...args: T) => string;
  } = {}
) {
  return async (...args: T): Promise<R> => {
    const { useQueue = true, useRateLimit = true, identifier } = options;
    
    // 限流检查
    if (useRateLimit && identifier) {
      const id = identifier(...args);
      if (!globalRateLimiter.isAllowed(id)) {
        throw new Error('Rate limit exceeded');
      }
    }
    
    // 队列控制
    if (useQueue) {
      return globalRequestQueue.enqueue(() => fn(...args));
    }
    
    return fn(...args);
  };
}