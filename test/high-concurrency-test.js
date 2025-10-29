#!/usr/bin/env node

/**
 * 高并发测试脚本
 * 专门测试系统在高并发情况下的表现和稳定性
 */

const http = require('http');
const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const BASE_URL = 'http://localhost:3000';
const MAX_WORKERS = Math.min(os.cpus().length, 8); // 限制工作线程数量

class HighConcurrencyTest {
    constructor() {
        this.results = {
            startTime: new Date(),
            endTime: null,
            concurrencyLevels: [],
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            timeouts: 0,
            errors: [],
            responseTimeStats: {
                min: Infinity,
                max: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                average: 0
            },
            throughputStats: {
                peak: 0,
                average: 0,
                sustained: 0
            },
            systemResources: {
                cpuUsage: [],
                memoryUsage: [],
                connectionStats: []
            }
        };
        this.responseTimes = [];
        this.activeConnections = 0;
    }

    // 监控系统资源
    monitorSystemResources() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.results.systemResources.memoryUsage.push({
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            timestamp: Date.now()
        });

        this.results.systemResources.cpuUsage.push({
            user: cpuUsage.user,
            system: cpuUsage.system,
            timestamp: Date.now()
        });

        this.results.systemResources.connectionStats.push({
            active: this.activeConnections,
            timestamp: Date.now()
        });
    }

    // 发送HTTP请求
    async makeRequest(url, method = 'GET', data = null, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            this.activeConnections++;

            const options = {
                method,
                timeout,
                headers: {
                    'User-Agent': 'HighConcurrencyTest/1.0',
                    'Connection': 'keep-alive',
                    'Accept': 'application/json,text/html,*/*'
                }
            };

            if (data) {
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
            }

            const req = http.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;
                    
                    this.activeConnections--;
                    this.results.totalRequests++;
                    this.responseTimes.push(responseTime);
                    
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        this.results.successfulRequests++;
                    } else {
                        this.results.failedRequests++;
                    }

                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        statusCode: res.statusCode,
                        responseTime,
                        dataSize: responseData.length
                    });
                });
            });

            req.on('timeout', () => {
                this.activeConnections--;
                this.results.totalRequests++;
                this.results.timeouts++;
                req.destroy();
                resolve({
                    success: false,
                    error: 'timeout',
                    responseTime: timeout
                });
            });

            req.on('error', (error) => {
                this.activeConnections--;
                this.results.totalRequests++;
                this.results.failedRequests++;
                this.results.errors.push({
                    error: error.message,
                    url,
                    timestamp: Date.now()
                });
                resolve({
                    success: false,
                    error: error.message,
                    responseTime: performance.now() - startTime
                });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // 并发请求测试
    async concurrentRequestTest(concurrency, duration, urls) {
        console.log(`🚀 测试并发级别: ${concurrency}, 持续时间: ${duration/1000}s`);
        
        const startTime = Date.now();
        const promises = [];
        let requestCount = 0;
        const intervalId = setInterval(() => this.monitorSystemResources(), 1000);

        try {
            while (Date.now() - startTime < duration) {
                // 控制并发数量
                while (this.activeConnections >= concurrency) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }

                const url = urls[Math.floor(Math.random() * urls.length)];
                const promise = this.makeRequest(url);
                promises.push(promise);
                requestCount++;

                // 避免过度消耗CPU
                if (requestCount % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }

            // 等待所有请求完成
            await Promise.all(promises);

        } finally {
            clearInterval(intervalId);
        }

        const actualDuration = Date.now() - startTime;
        const throughput = (requestCount / actualDuration) * 1000; // 每秒请求数

        const testResult = {
            concurrency,
            duration: actualDuration,
            requestCount,
            throughput: throughput.toFixed(2),
            successRate: ((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2),
            averageResponseTime: this.calculateAverageResponseTime().toFixed(2)
        };

        this.results.concurrencyLevels.push(testResult);
        console.log(`✅ 并发 ${concurrency}: ${requestCount} 请求, ${throughput.toFixed(2)} req/s, ${testResult.successRate}% 成功率`);

        return testResult;
    }

    // 阶梯式并发测试
    async stepwiseConcurrencyTest() {
        console.log('📈 开始阶梯式并发测试...');
        
        const testUrls = [
            `${BASE_URL}/`,
            `${BASE_URL}/flights`,
            `${BASE_URL}/api/flights`,
            `${BASE_URL}/api/flights?from=北京&to=上海`
        ];

        const concurrencyLevels = [1, 5, 10, 20, 50, 100, 200, 500];
        const testDuration = 30000; // 每个级别测试30秒

        for (const concurrency of concurrencyLevels) {
            await this.concurrentRequestTest(concurrency, testDuration, testUrls);
            
            // 检查错误率，如果太高就停止增加并发
            const errorRate = (this.results.failedRequests + this.results.timeouts) / this.results.totalRequests;
            if (errorRate > 0.1) { // 错误率超过10%
                console.log(`⚠️  错误率过高 (${(errorRate * 100).toFixed(2)}%)，停止增加并发`);
                break;
            }

            // 短暂休息让系统恢复
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // 峰值并发测试
    async peakConcurrencyTest() {
        console.log('⚡ 开始峰值并发测试...');
        
        const testUrls = [
            `${BASE_URL}/`,
            `${BASE_URL}/api/flights`
        ];

        // 找到最佳并发级别（成功率>95%的最高并发）
        let optimalConcurrency = 50;
        for (const level of this.results.concurrencyLevels.reverse()) {
            if (parseFloat(level.successRate) >= 95) {
                optimalConcurrency = level.concurrency;
                break;
            }
        }

        console.log(`使用最佳并发级别: ${optimalConcurrency}`);
        
        // 进行长时间峰值测试
        await this.concurrentRequestTest(optimalConcurrency, 120000, testUrls); // 2分钟
    }

    // 突发流量测试
    async burstTrafficTest() {
        console.log('💥 开始突发流量测试...');
        
        const testUrls = [`${BASE_URL}/`, `${BASE_URL}/api/flights`];
        const burstPromises = [];

        // 模拟突发流量：短时间内发送大量请求
        for (let i = 0; i < 1000; i++) {
            const url = testUrls[Math.floor(Math.random() * testUrls.length)];
            burstPromises.push(this.makeRequest(url, 'GET', null, 5000));
            
            // 每100个请求稍微延迟一下
            if (i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const burstStartTime = Date.now();
        await Promise.all(burstPromises);
        const burstDuration = Date.now() - burstStartTime;

        console.log(`突发流量测试完成: 1000 请求在 ${(burstDuration/1000).toFixed(2)}s 内完成`);
        
        return {
            requestCount: 1000,
            duration: burstDuration,
            throughput: (1000 / burstDuration * 1000).toFixed(2)
        };
    }

    // 计算响应时间统计
    calculateResponseTimeStats() {
        if (this.responseTimes.length === 0) return;

        this.responseTimes.sort((a, b) => a - b);
        
        this.results.responseTimeStats.min = this.responseTimes[0];
        this.results.responseTimeStats.max = this.responseTimes[this.responseTimes.length - 1];
        this.results.responseTimeStats.average = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
        
        // 计算百分位数
        this.results.responseTimeStats.p50 = this.responseTimes[Math.floor(this.responseTimes.length * 0.5)];
        this.results.responseTimeStats.p95 = this.responseTimes[Math.floor(this.responseTimes.length * 0.95)];
        this.results.responseTimeStats.p99 = this.responseTimes[Math.floor(this.responseTimes.length * 0.99)];
    }

    calculateAverageResponseTime() {
        if (this.responseTimes.length === 0) return 0;
        return this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }

    // 计算吞吐量统计
    calculateThroughputStats() {
        const throughputs = this.results.concurrencyLevels.map(level => parseFloat(level.throughput));
        
        if (throughputs.length > 0) {
            this.results.throughputStats.peak = Math.max(...throughputs);
            this.results.throughputStats.average = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
            
            // 持续吞吐量：成功率>95%的最高吞吐量
            const sustainedThroughputs = this.results.concurrencyLevels
                .filter(level => parseFloat(level.successRate) >= 95)
                .map(level => parseFloat(level.throughput));
            
            this.results.throughputStats.sustained = sustainedThroughputs.length > 0 ? 
                Math.max(...sustainedThroughputs) : 0;
        }
    }

    // 运行高并发测试
    async runHighConcurrencyTest() {
        console.log('🔥 开始高并发测试...');
        console.log(`系统信息: ${os.cpus().length} CPU核心, ${(os.totalmem()/1024/1024/1024).toFixed(2)}GB 总内存`);
        
        this.results.startTime = new Date();

        try {
            // 阶段1: 阶梯式并发测试
            await this.stepwiseConcurrencyTest();
            
            // 阶段2: 峰值并发测试
            await this.peakConcurrencyTest();
            
            // 阶段3: 突发流量测试
            const burstResult = await this.burstTrafficTest();
            
            // 计算统计数据
            this.calculateResponseTimeStats();
            this.calculateThroughputStats();
            
            this.results.endTime = new Date();
            
            return this.generateReport(burstResult);
            
        } catch (error) {
            console.error('高并发测试失败:', error);
            this.results.errors.push({
                error: error.message,
                timestamp: Date.now(),
                phase: 'main_test'
            });
            throw error;
        }
    }

    // 生成报告
    generateReport(burstResult) {
        const duration = this.results.endTime - this.results.startTime;
        
        const report = {
            testType: 'high_concurrency_test',
            summary: {
                duration: duration,
                totalRequests: this.results.totalRequests,
                successfulRequests: this.results.successfulRequests,
                failedRequests: this.results.failedRequests,
                timeouts: this.results.timeouts,
                successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2),
                overallThroughput: (this.results.totalRequests / (duration / 1000)).toFixed(2)
            },
            performance: {
                responseTime: {
                    min: this.results.responseTimeStats.min.toFixed(2),
                    max: this.results.responseTimeStats.max.toFixed(2),
                    average: this.results.responseTimeStats.average.toFixed(2),
                    p50: this.results.responseTimeStats.p50.toFixed(2),
                    p95: this.results.responseTimeStats.p95.toFixed(2),
                    p99: this.results.responseTimeStats.p99.toFixed(2)
                },
                throughput: {
                    peak: this.results.throughputStats.peak.toFixed(2),
                    average: this.results.throughputStats.average.toFixed(2),
                    sustained: this.results.throughputStats.sustained.toFixed(2)
                }
            },
            concurrencyAnalysis: this.results.concurrencyLevels,
            burstTraffic: burstResult,
            systemResources: {
                peakMemoryUsage: this.getPeakMemoryUsage(),
                averageCpuUsage: this.getAverageCpuUsage(),
                maxConnections: Math.max(...this.results.systemResources.connectionStats.map(c => c.active))
            },
            errors: this.results.errors.slice(0, 10),
            recommendations: this.generateRecommendations()
        };

        console.log('\n📊 高并发测试报告:');
        console.log(`测试时长: ${(duration/1000/60).toFixed(2)} 分钟`);
        console.log(`总请求数: ${report.summary.totalRequests}`);
        console.log(`成功率: ${(this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2)}%`);
        console.log(`峰值吞吐量: ${report.performance.throughput.peak} req/s`);
        console.log(`持续吞吐量: ${report.performance.throughput.sustained} req/s`);
        console.log(`响应时间 P95: ${report.performance.responseTime.p95}ms`);
        console.log(`最大并发连接: ${report.systemResources.maxConnections}`);

        return report;
    }

    getPeakMemoryUsage() {
        const memoryUsages = this.results.systemResources.memoryUsage;
        if (memoryUsages.length === 0) return 0;
        
        const peak = Math.max(...memoryUsages.map(m => m.rss));
        return (peak / 1024 / 1024).toFixed(2); // MB
    }

    getAverageCpuUsage() {
        const cpuUsages = this.results.systemResources.cpuUsage;
        if (cpuUsages.length === 0) return 0;
        
        const totalCpu = cpuUsages.reduce((sum, cpu) => sum + cpu.user + cpu.system, 0);
        return (totalCpu / cpuUsages.length / 1000000).toFixed(2); // 转换为秒
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.throughputStats.sustained < 100) {
            recommendations.push('持续吞吐量较低，建议优化服务器性能和数据库连接');
        }
        
        if (this.results.responseTimeStats.p95 > 2000) {
            recommendations.push('P95响应时间较长，建议优化慢查询和缓存策略');
        }
        
        const successRate = (this.results.successfulRequests / this.results.totalRequests * 100);
        if (successRate < 95) {
            recommendations.push('成功率较低，建议检查错误处理和系统稳定性');
        }
        
        if (this.results.timeouts > this.results.totalRequests * 0.01) {
            recommendations.push('超时请求较多，建议增加超时时间或优化请求处理');
        }

        const maxConcurrency = Math.max(...this.results.concurrencyLevels.map(l => l.concurrency));
        if (maxConcurrency < 200) {
            recommendations.push('系统并发能力有限，建议考虑负载均衡和水平扩展');
        }

        return recommendations;
    }

    async run() {
        return await this.runHighConcurrencyTest();
    }
}

// 主函数
async function main() {
    const tester = new HighConcurrencyTest();
    
    try {
        const report = await tester.runHighConcurrencyTest();
        
        // 保存报告
        const fs = require('fs');
        const reportPath = 'high-concurrency-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存到: ${reportPath}`);
        
        return report;
    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { HighConcurrencyTest };