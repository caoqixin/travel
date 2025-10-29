#!/usr/bin/env node

/**
 * 深度暴力测试脚本
 * 测试系统在极限条件下的稳定性和内存使用情况
 * 内存限制: 16GB
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const os = require('os');

const BASE_URL = 'http://localhost:3000';
const MAX_MEMORY_GB = 16;
const MAX_MEMORY_BYTES = MAX_MEMORY_GB * 1024 * 1024 * 1024;

class BrutalStressTest {
    constructor() {
        this.results = {
            startTime: new Date(),
            endTime: null,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            timeouts: 0,
            errors: [],
            memoryUsage: [],
            responseTimeStats: {
                min: Infinity,
                max: 0,
                total: 0,
                average: 0
            },
            concurrencyLevels: [],
            systemStats: {
                initialMemory: process.memoryUsage(),
                peakMemory: process.memoryUsage(),
                cpuUsage: []
            }
        };
        this.isRunning = false;
        this.activeRequests = 0;
    }

    // 内存监控
    monitorMemory() {
        const memUsage = process.memoryUsage();
        const systemMem = {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            timestamp: Date.now()
        };

        this.results.memoryUsage.push(systemMem);
        
        // 更新峰值内存
        if (memUsage.heapUsed > this.results.systemStats.peakMemory.heapUsed) {
            this.results.systemStats.peakMemory = memUsage;
        }

        // 检查内存限制
        if (memUsage.rss > MAX_MEMORY_BYTES * 0.9) {
            console.warn(`⚠️  内存使用接近限制: ${(memUsage.rss / 1024 / 1024 / 1024).toFixed(2)}GB`);
        }

        return systemMem;
    }

    // CPU监控
    monitorCPU() {
        const cpuUsage = process.cpuUsage();
        this.results.systemStats.cpuUsage.push({
            user: cpuUsage.user,
            system: cpuUsage.system,
            timestamp: Date.now()
        });
    }

    // 发送HTTP请求
    async makeRequest(url, method = 'GET', data = null, timeout = 30000) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            this.activeRequests++;

            const options = {
                method,
                timeout,
                headers: {
                    'User-Agent': 'BrutalStressTest/1.0',
                    'Connection': 'keep-alive'
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
                    
                    this.activeRequests--;
                    this.results.totalRequests++;
                    
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        this.results.successfulRequests++;
                    } else {
                        this.results.failedRequests++;
                    }

                    // 更新响应时间统计
                    this.updateResponseTimeStats(responseTime);

                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        statusCode: res.statusCode,
                        responseTime,
                        dataSize: responseData.length
                    });
                });
            });

            req.on('timeout', () => {
                this.activeRequests--;
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
                this.activeRequests--;
                this.results.totalRequests++;
                this.results.failedRequests++;
                this.results.errors.push({
                    error: error.message,
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

    updateResponseTimeStats(responseTime) {
        this.results.responseTimeStats.min = Math.min(this.results.responseTimeStats.min, responseTime);
        this.results.responseTimeStats.max = Math.max(this.results.responseTimeStats.max, responseTime);
        this.results.responseTimeStats.total += responseTime;
        this.results.responseTimeStats.average = this.results.responseTimeStats.total / this.results.successfulRequests;
    }

    // 并发请求测试
    async concurrentRequests(urls, concurrency, duration = 60000) {
        console.log(`🚀 开始并发测试: ${concurrency} 并发, 持续 ${duration/1000}s`);
        
        const startTime = Date.now();
        const promises = [];

        while (Date.now() - startTime < duration && this.isRunning) {
            // 控制并发数量
            while (this.activeRequests >= concurrency) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const url = urls[Math.floor(Math.random() * urls.length)];
            promises.push(this.makeRequest(url));

            // 监控系统资源
            if (this.results.totalRequests % 100 === 0) {
                this.monitorMemory();
                this.monitorCPU();
            }

            // 短暂延迟避免过度消耗CPU
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        }

        // 等待所有请求完成
        await Promise.all(promises);
        
        this.results.concurrencyLevels.push({
            concurrency,
            duration,
            requests: promises.length,
            timestamp: Date.now()
        });
    }

    // 内存泄漏测试
    async memoryLeakTest() {
        console.log('🧠 开始内存泄漏测试...');
        
        const initialMemory = this.monitorMemory();
        const largeDataRequests = [];

        // 创建大量请求来测试内存管理
        for (let i = 0; i < 1000; i++) {
            const promise = this.makeRequest(`${BASE_URL}/api/flights`);
            largeDataRequests.push(promise);

            if (i % 100 === 0) {
                const currentMemory = this.monitorMemory();
                console.log(`内存使用: ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB`);
                
                // 如果内存增长过快，暂停一下
                if (currentMemory.rss > initialMemory.rss * 2) {
                    console.log('⚠️  内存增长过快，暂停测试...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        await Promise.all(largeDataRequests);
        
        // 强制垃圾回收
        if (global.gc) {
            global.gc();
        }

        const finalMemory = this.monitorMemory();
        console.log(`内存泄漏测试完成. 初始: ${(initialMemory.rss/1024/1024).toFixed(2)}MB, 最终: ${(finalMemory.rss/1024/1024).toFixed(2)}MB`);
    }

    // 错误注入测试
    async errorInjectionTest() {
        console.log('💥 开始错误注入测试...');
        
        const errorUrls = [
            `${BASE_URL}/nonexistent-page`,
            `${BASE_URL}/api/invalid-endpoint`,
            `${BASE_URL}/admin/unauthorized`,
            `${BASE_URL}/api/flights/invalid-id`,
            `${BASE_URL}/api/admin/flights/malformed-request`
        ];

        const errorPromises = [];
        for (let i = 0; i < 200; i++) {
            const url = errorUrls[Math.floor(Math.random() * errorUrls.length)];
            errorPromises.push(this.makeRequest(url));
        }

        await Promise.all(errorPromises);
        console.log('错误注入测试完成');
    }

    // 主测试流程
    async runBrutalTest() {
        console.log('🔥 开始深度暴力测试...');
        console.log(`内存限制: ${MAX_MEMORY_GB}GB`);
        console.log(`系统信息: ${os.cpus().length} CPU核心, ${(os.totalmem()/1024/1024/1024).toFixed(2)}GB 总内存`);
        
        this.isRunning = true;
        this.results.startTime = new Date();

        const testUrls = [
            `${BASE_URL}/`,
            `${BASE_URL}/flights`,
            `${BASE_URL}/api/flights`,
            `${BASE_URL}/admin/login`,
            `${BASE_URL}/admin/access`
        ];

        try {
            // 阶段1: 逐步增加并发
            console.log('\n📈 阶段1: 逐步增加并发测试');
            const concurrencyLevels = [1, 5, 10, 20, 50, 100, 200];
            
            for (const concurrency of concurrencyLevels) {
                if (!this.isRunning) break;
                await this.concurrentRequests(testUrls, concurrency, 30000);
                console.log(`并发 ${concurrency}: 完成 ${this.results.totalRequests} 请求`);
                
                // 检查内存使用
                const memUsage = this.monitorMemory();
                if (memUsage.rss > MAX_MEMORY_BYTES * 0.8) {
                    console.log('⚠️  内存使用过高，停止增加并发');
                    break;
                }
            }

            // 阶段2: 内存泄漏测试
            console.log('\n🧠 阶段2: 内存泄漏测试');
            await this.memoryLeakTest();

            // 阶段3: 错误注入测试
            console.log('\n💥 阶段3: 错误注入测试');
            await this.errorInjectionTest();

            // 阶段4: 长时间稳定性测试
            console.log('\n⏰ 阶段4: 长时间稳定性测试 (5分钟)');
            await this.concurrentRequests(testUrls, 50, 300000);

        } catch (error) {
            console.error('测试过程中发生错误:', error);
            this.results.errors.push({
                error: error.message,
                timestamp: Date.now(),
                phase: 'main_test'
            });
        } finally {
            this.isRunning = false;
            this.results.endTime = new Date();
        }

        return this.generateReport();
    }

    generateReport() {
        const duration = this.results.endTime - this.results.startTime;
        const finalMemory = this.monitorMemory();

        const report = {
            testType: 'brutal_stress_test',
            summary: {
                duration: duration,
                totalRequests: this.results.totalRequests,
                successfulRequests: this.results.successfulRequests,
                failedRequests: this.results.failedRequests,
                timeouts: this.results.timeouts,
                successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2),
                requestsPerSecond: (this.results.totalRequests / (duration / 1000)).toFixed(2)
            },
            performance: {
                responseTime: {
                    min: this.results.responseTimeStats.min.toFixed(2),
                    max: this.results.responseTimeStats.max.toFixed(2),
                    average: this.results.responseTimeStats.average.toFixed(2)
                },
                memory: {
                    initial: (this.results.systemStats.initialMemory.rss / 1024 / 1024).toFixed(2),
                    peak: (this.results.systemStats.peakMemory.rss / 1024 / 1024).toFixed(2),
                    final: (finalMemory.rss / 1024 / 1024).toFixed(2),
                    memoryEfficiency: ((finalMemory.rss / MAX_MEMORY_BYTES) * 100).toFixed(2)
                }
            },
            concurrency: this.results.concurrencyLevels,
            errors: this.results.errors.slice(0, 10), // 只显示前10个错误
            recommendations: this.generateRecommendations()
        };

        console.log('\n📊 深度暴力测试报告:');
        console.log(`测试时长: ${(duration/1000/60).toFixed(2)} 分钟`);
        console.log(`总请求数: ${report.summary.totalRequests}`);
        console.log(`成功率: ${(this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2)}%`);
        console.log(`平均响应时间: ${report.performance.responseTime.average}ms`);
        console.log(`内存使用: ${report.performance.memory.initial}MB → ${report.performance.memory.peak}MB (峰值) → ${report.performance.memory.final}MB`);
        console.log(`内存效率: ${report.performance.memory.memoryEfficiency}% (${MAX_MEMORY_GB}GB限制)`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.failedRequests / this.results.totalRequests > 0.05) {
            recommendations.push('错误率较高，建议检查服务器稳定性和错误处理机制');
        }
        
        if (this.results.responseTimeStats.average > 1000) {
            recommendations.push('平均响应时间较长，建议优化数据库查询和缓存策略');
        }
        
        if (this.results.systemStats.peakMemory.rss > MAX_MEMORY_BYTES * 0.7) {
            recommendations.push('内存使用较高，建议优化内存管理和实施内存监控');
        }
        
        if (this.results.timeouts > this.results.totalRequests * 0.01) {
            recommendations.push('超时请求较多，建议增加服务器资源或优化请求处理');
        }

        return recommendations;
    }

    async run() {
        return await this.runBrutalTest();
    }
}

// 主函数
async function main() {
    const tester = new BrutalStressTest();
    
    // 启用垃圾回收（如果可用）
    if (global.gc) {
        console.log('✅ 垃圾回收已启用');
    } else {
        console.log('⚠️  垃圾回收未启用，建议使用 --expose-gc 参数运行');
    }

    try {
        const report = await tester.runBrutalTest();
        
        // 保存报告
        const fs = require('fs');
        const reportPath = 'brutal-stress-test-report.json';
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

module.exports = { BrutalStressTest };