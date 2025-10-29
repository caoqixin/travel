'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Zap, 
  MemoryStick, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Server
} from 'lucide-react';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    cache: HealthCheck;
    memory: HealthCheck;
    performance: HealthCheck;
    concurrency: HealthCheck;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    requestQueue: any;
    connectionPool: any;
  };
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
  details?: any;
}

interface PerformanceStats {
  totalRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  statusCodes: Record<string, number>;
  timeRange: string;
  requestsPerSecond: number;
  memoryUsage: {
    current: number;
    peak: number;
    average: number;
  };
  cpuUsage: {
    current: number;
    average: number;
  };
}

const PerformanceDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 获取健康检查数据
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  // 获取性能数据
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/admin/performance');
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchHealthData(), fetchPerformanceData()]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  // 自动刷新
  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // 30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warn':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // 状态徽章
  const getStatusBadge = (status: string) => {
    const variant = status === 'pass' || status === 'healthy' ? 'default' :
                   status === 'warn' || status === 'degraded' ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  // 格式化时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // 格式化内存大小
  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载性能数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部控制 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">性能监控仪表板</h2>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              最后更新: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 系统概览 */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">系统状态</p>
                  <p className="text-2xl font-bold">
                    {getStatusBadge(healthData.status)}
                  </p>
                </div>
                <Server className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">运行时间</p>
                  <p className="text-2xl font-bold">
                    {formatUptime(healthData.uptime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">内存使用</p>
                  <p className="text-2xl font-bold">
                    {formatMemory(healthData.metrics.memoryUsage.heapUsed)}
                  </p>
                </div>
                <MemoryStick className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">版本</p>
                  <p className="text-2xl font-bold">{healthData.version}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 详细检查结果 */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 数据库检查 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据库
                {getStatusBadge(healthData.checks.database.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {healthData.checks.database.message}
              </p>
              {healthData.checks.database.responseTime && (
                <p className="text-xs text-gray-500">
                  响应时间: {healthData.checks.database.responseTime}ms
                </p>
              )}
            </CardContent>
          </Card>

          {/* 缓存检查 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                缓存
                {getStatusBadge(healthData.checks.cache.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {healthData.checks.cache.message}
              </p>
              {healthData.checks.cache.responseTime && (
                <p className="text-xs text-gray-500">
                  响应时间: {healthData.checks.cache.responseTime}ms
                </p>
              )}
            </CardContent>
          </Card>

          {/* 内存检查 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                内存
                {getStatusBadge(healthData.checks.memory.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {healthData.checks.memory.message}
              </p>
              {healthData.checks.memory.details && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>已用: {healthData.checks.memory.details.usedMemory}</p>
                  <p>总计: {healthData.checks.memory.details.totalMemory}</p>
                  <p>使用率: {healthData.checks.memory.details.usagePercent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 性能检查 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                性能
                {getStatusBadge(healthData.checks.performance.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {healthData.checks.performance.message}
              </p>
              {healthData.checks.performance.details && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>平均响应: {healthData.checks.performance.details.avgResponseTime}</p>
                  <p>最大响应: {healthData.checks.performance.details.maxResponseTime}</p>
                  <p>错误率: {healthData.checks.performance.details.errorRate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 并发检查 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                并发控制
                {getStatusBadge(healthData.checks.concurrency.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                {healthData.checks.concurrency.message}
              </p>
              {healthData.checks.concurrency.details && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>队列长度: {healthData.checks.concurrency.details.requestQueue?.queueLength || 0}</p>
                  <p>连接池使用: {healthData.checks.concurrency.details.poolUsagePercent}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 性能统计 */}
      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              性能统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {performanceData.totalRequests}
                </p>
                <p className="text-sm text-gray-500">总请求数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {performanceData.avgResponseTime}ms
                </p>
                <p className="text-sm text-gray-500">平均响应时间</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {performanceData.maxResponseTime}ms
                </p>
                <p className="text-sm text-gray-500">最大响应时间</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {performanceData.requestsPerSecond.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">请求/秒</p>
              </div>
            </div>

            {/* 状态码分布 */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">HTTP状态码分布</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(performanceData.statusCodes).map(([code, count]) => (
                  <div key={code} className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-bold">{code}</p>
                    <p className="text-sm text-gray-600">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard;