const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { performance } = require("perf_hooks");

class PerformanceTest {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.memoryLimit = 16 * 1024 * 1024 * 1024; // 16GB in bytes
    this.results = {
      startTime: new Date(),
      endTime: null,
      testSummary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        throughput: 0,
        errorRate: 0,
      },
      performanceMetrics: {
        cpuUsage: [],
        memoryUsage: [],
        responseTimeDistribution: {
          under100ms: 0,
          under500ms: 0,
          under1s: 0,
          under2s: 0,
          over2s: 0,
        },
        statusCodes: {},
        errors: [],
      },
      testPhases: [],
      recommendations: [],
    };
    this.testRoutes = [
      "/",
      "/flights",
      "/admin/login",
      "/admin/access",
      "/admin/dashboard",
      "/admin/flights",
      "/admin/forgot-password",
      "/admin/reset-password",
      "/api/health",
      "/nonexistent-page",
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.get(
        url,
        {
          timeout: 30000,
          ...options,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            resolve({
              success: true,
              statusCode: res.statusCode,
              responseTime,
              dataSize: Buffer.byteLength(data),
              headers: res.headers,
            });
          });
        }
      );

      req.on("error", (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        resolve({
          success: false,
          error: error.message,
          responseTime,
          statusCode: 0,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        resolve({
          success: false,
          error: "Request timeout",
          responseTime,
          statusCode: 0,
        });
      });
    });
  }

  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        systemFree: os.freemem(),
        systemTotal: os.totalmem(),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: os.loadavg(),
      },
      timestamp: Date.now(),
    };
  }

  updateResponseTimeDistribution(responseTime) {
    if (responseTime < 100) {
      this.results.performanceMetrics.responseTimeDistribution.under100ms++;
    } else if (responseTime < 500) {
      this.results.performanceMetrics.responseTimeDistribution.under500ms++;
    } else if (responseTime < 1000) {
      this.results.performanceMetrics.responseTimeDistribution.under1s++;
    } else if (responseTime < 2000) {
      this.results.performanceMetrics.responseTimeDistribution.under2s++;
    } else {
      this.results.performanceMetrics.responseTimeDistribution.over2s++;
    }
  }

  updateResults(response) {
    this.results.testSummary.totalRequests++;

    if (response.success) {
      this.results.testSummary.successfulRequests++;
    } else {
      this.results.testSummary.failedRequests++;
      this.results.performanceMetrics.errors.push({
        error: response.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Update response time statistics
    const responseTime = response.responseTime;
    this.results.testSummary.minResponseTime = Math.min(
      this.results.testSummary.minResponseTime,
      responseTime
    );
    this.results.testSummary.maxResponseTime = Math.max(
      this.results.testSummary.maxResponseTime,
      responseTime
    );

    this.updateResponseTimeDistribution(responseTime);

    // Update status codes
    const statusCode = response.statusCode || 0;
    this.results.performanceMetrics.statusCodes[statusCode] =
      (this.results.performanceMetrics.statusCodes[statusCode] || 0) + 1;
  }

  async runBasicPerformanceTest() {
    this.log("开始基础性能测试...");
    const phaseResults = {
      name: "基础性能测试",
      startTime: new Date(),
      requests: 0,
      avgResponseTime: 0,
      errors: 0,
    };

    const totalRequests = 100;
    const responseTimes = [];

    for (let i = 0; i < totalRequests; i++) {
      const route = this.testRoutes[i % this.testRoutes.length];
      const url = `${this.baseUrl}${route}`;

      const response = await this.makeRequest(url);
      this.updateResults(response);
      responseTimes.push(response.responseTime);

      phaseResults.requests++;
      if (!response.success) phaseResults.errors++;

      // 记录系统指标
      if (i % 10 === 0) {
        const metrics = this.getSystemMetrics();
        this.results.performanceMetrics.cpuUsage.push(metrics.cpu);
        this.results.performanceMetrics.memoryUsage.push(metrics.memory);
      }

      // 检查内存限制
      const currentMemory = process.memoryUsage().rss;
      if (currentMemory > this.memoryLimit * 0.9) {
        this.log(
          `警告: 内存使用接近限制 (${(
            currentMemory /
            1024 /
            1024 /
            1024
          ).toFixed(2)}GB)`
        );
        break;
      }

      // 小延迟避免过载
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    phaseResults.endTime = new Date();
    phaseResults.avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    this.results.testPhases.push(phaseResults);

    this.log(
      `基础性能测试完成: ${
        phaseResults.requests
      }个请求, 平均响应时间: ${phaseResults.avgResponseTime.toFixed(2)}ms`
    );
  }

  async runLoadTest() {
    this.log("开始负载测试...");
    const phaseResults = {
      name: "负载测试",
      startTime: new Date(),
      requests: 0,
      avgResponseTime: 0,
      errors: 0,
    };

    const concurrentUsers = 20;
    const requestsPerUser = 25;
    const responseTimes = [];

    const userPromises = [];
    for (let user = 0; user < concurrentUsers; user++) {
      const userPromise = (async () => {
        for (let req = 0; req < requestsPerUser; req++) {
          const route = this.testRoutes[req % this.testRoutes.length];
          const url = `${this.baseUrl}${route}`;

          const response = await this.makeRequest(url);
          this.updateResults(response);
          responseTimes.push(response.responseTime);

          phaseResults.requests++;
          if (!response.success) phaseResults.errors++;

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      })();
      userPromises.push(userPromise);
    }

    await Promise.all(userPromises);

    phaseResults.endTime = new Date();
    phaseResults.avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    this.results.testPhases.push(phaseResults);

    this.log(
      `负载测试完成: ${
        phaseResults.requests
      }个请求, 平均响应时间: ${phaseResults.avgResponseTime.toFixed(2)}ms`
    );
  }

  async runSpikeTest() {
    this.log("开始峰值测试...");
    const phaseResults = {
      name: "峰值测试",
      startTime: new Date(),
      requests: 0,
      avgResponseTime: 0,
      errors: 0,
    };

    const spikeConcurrency = 50;
    const spikeRequests = 10;
    const responseTimes = [];

    const spikePromises = [];
    for (let i = 0; i < spikeConcurrency; i++) {
      const spikePromise = (async () => {
        for (let req = 0; req < spikeRequests; req++) {
          const route = this.testRoutes[req % this.testRoutes.length];
          const url = `${this.baseUrl}${route}`;

          const response = await this.makeRequest(url);
          this.updateResults(response);
          responseTimes.push(response.responseTime);

          phaseResults.requests++;
          if (!response.success) phaseResults.errors++;
        }
      })();
      spikePromises.push(spikePromise);
    }

    await Promise.all(spikePromises);

    phaseResults.endTime = new Date();
    phaseResults.avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    this.results.testPhases.push(phaseResults);

    this.log(
      `峰值测试完成: ${
        phaseResults.requests
      }个请求, 平均响应时间: ${phaseResults.avgResponseTime.toFixed(2)}ms`
    );
  }

  async runEnduranceTest() {
    this.log("开始耐久性测试...");
    const phaseResults = {
      name: "耐久性测试",
      startTime: new Date(),
      requests: 0,
      avgResponseTime: 0,
      errors: 0,
    };

    const testDuration = 5 * 60 * 1000; // 5分钟
    const requestInterval = 1000; // 每秒1个请求
    const startTime = Date.now();
    const responseTimes = [];

    while (Date.now() - startTime < testDuration) {
      const route =
        this.testRoutes[phaseResults.requests % this.testRoutes.length];
      const url = `${this.baseUrl}${route}`;

      const response = await this.makeRequest(url);
      this.updateResults(response);
      responseTimes.push(response.responseTime);

      phaseResults.requests++;
      if (!response.success) phaseResults.errors++;

      // 每分钟记录系统指标
      if (phaseResults.requests % 60 === 0) {
        const metrics = this.getSystemMetrics();
        this.results.performanceMetrics.cpuUsage.push(metrics.cpu);
        this.results.performanceMetrics.memoryUsage.push(metrics.memory);

        this.log(`耐久性测试进行中: ${phaseResults.requests}个请求完成`);
      }

      // 检查内存限制
      const currentMemory = process.memoryUsage().rss;
      if (currentMemory > this.memoryLimit * 0.9) {
        this.log(`内存限制达到，提前结束耐久性测试`);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, requestInterval));
    }

    phaseResults.endTime = new Date();
    phaseResults.avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    this.results.testPhases.push(phaseResults);

    this.log(
      `耐久性测试完成: ${
        phaseResults.requests
      }个请求, 平均响应时间: ${phaseResults.avgResponseTime.toFixed(2)}ms`
    );
  }

  calculateFinalMetrics() {
    const totalRequests = this.results.testSummary.totalRequests;
    const successfulRequests = this.results.testSummary.successfulRequests;

    // 计算平均响应时间
    const totalResponseTime = this.results.testPhases.reduce((sum, phase) => {
      return sum + phase.avgResponseTime * phase.requests;
    }, 0);
    this.results.testSummary.averageResponseTime =
      totalResponseTime / totalRequests;

    // 计算吞吐量 (requests per second)
    const testDuration = (this.results.endTime - this.results.startTime) / 1000;
    this.results.testSummary.throughput = totalRequests / testDuration;

    // 计算错误率
    this.results.testSummary.errorRate =
      (this.results.testSummary.failedRequests / totalRequests) * 100;

    // 修正最小响应时间
    if (this.results.testSummary.minResponseTime === Infinity) {
      this.results.testSummary.minResponseTime = 0;
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const avgResponseTime = this.results.testSummary.averageResponseTime;
    const errorRate = this.results.testSummary.errorRate;
    const throughput = this.results.testSummary.throughput;

    // 响应时间建议
    if (avgResponseTime > 2000) {
      recommendations.push("响应时间过长，建议优化数据库查询和缓存策略");
    } else if (avgResponseTime > 1000) {
      recommendations.push("响应时间偏高，考虑优化代码性能和资源加载");
    } else if (avgResponseTime < 100) {
      recommendations.push("响应时间优秀，系统性能良好");
    }

    // 错误率建议
    if (errorRate > 5) {
      recommendations.push("错误率过高，需要检查系统稳定性和错误处理");
    } else if (errorRate > 1) {
      recommendations.push("错误率偏高，建议改进错误处理机制");
    } else {
      recommendations.push("错误率良好，系统稳定性较高");
    }

    // 吞吐量建议
    if (throughput < 10) {
      recommendations.push("吞吐量较低，考虑优化服务器配置和并发处理");
    } else if (throughput > 100) {
      recommendations.push("吞吐量优秀，系统处理能力强");
    }

    // 内存使用建议
    const maxMemory = Math.max(
      ...this.results.performanceMetrics.memoryUsage.map((m) => m.rss)
    );
    const memoryUsageGB = maxMemory / 1024 / 1024 / 1024;
    if (memoryUsageGB > 12) {
      recommendations.push("内存使用量接近限制，建议优化内存管理");
    } else if (memoryUsageGB < 2) {
      recommendations.push("内存使用效率良好");
    }

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    this.results.endTime = new Date();
    this.calculateFinalMetrics();
    this.generateRecommendations();

    const reportPath = path.join(
      __dirname,
      "..",
      "performance-test-report.json"
    );
    const htmlReportPath = path.join(
      __dirname,
      "..",
      "performance-test-report.html"
    );

    // 生成JSON报告
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);

    this.log(`性能测试报告已生成:`);
    this.log(`- JSON报告: ${reportPath}`);
    this.log(`- HTML报告: ${htmlReportPath}`);

    return this.results;
  }

  generateHtmlReport() {
    const results = this.results;
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 14px; }
        .phase-results { margin: 20px 0; }
        .phase { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .recommendations { background: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>性能测试报告</h1>
        <p><strong>测试时间:</strong> ${results.startTime.toLocaleString()} - ${results.endTime.toLocaleString()}</p>
        <p><strong>测试持续时间:</strong> ${Math.round(
          (results.endTime - results.startTime) / 1000
        )}秒</p>

        <h2>测试概览</h2>
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${
                  results.testSummary.totalRequests
                }</div>
                <div class="metric-label">总请求数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.testSummary.averageResponseTime.toFixed(
                  2
                )}ms</div>
                <div class="metric-label">平均响应时间</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${results.testSummary.throughput.toFixed(
                  2
                )}</div>
                <div class="metric-label">吞吐量 (req/s)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${
                  results.testSummary.errorRate > 5 ? "error" : "success"
                }">${results.testSummary.errorRate.toFixed(2)}%</div>
                <div class="metric-label">错误率</div>
            </div>
        </div>

        <h2>响应时间分布</h2>
        <table>
            <tr><th>响应时间范围</th><th>请求数量</th><th>百分比</th></tr>
            <tr><td>&lt; 100ms</td><td>${
              results.performanceMetrics.responseTimeDistribution.under100ms
            }</td><td>${(
      (results.performanceMetrics.responseTimeDistribution.under100ms /
        results.testSummary.totalRequests) *
      100
    ).toFixed(1)}%</td></tr>
            <tr><td>100ms - 500ms</td><td>${
              results.performanceMetrics.responseTimeDistribution.under500ms
            }</td><td>${(
      (results.performanceMetrics.responseTimeDistribution.under500ms /
        results.testSummary.totalRequests) *
      100
    ).toFixed(1)}%</td></tr>
            <tr><td>500ms - 1s</td><td>${
              results.performanceMetrics.responseTimeDistribution.under1s
            }</td><td>${(
      (results.performanceMetrics.responseTimeDistribution.under1s /
        results.testSummary.totalRequests) *
      100
    ).toFixed(1)}%</td></tr>
            <tr><td>1s - 2s</td><td>${
              results.performanceMetrics.responseTimeDistribution.under2s
            }</td><td>${(
      (results.performanceMetrics.responseTimeDistribution.under2s /
        results.testSummary.totalRequests) *
      100
    ).toFixed(1)}%</td></tr>
            <tr><td>&gt; 2s</td><td>${
              results.performanceMetrics.responseTimeDistribution.over2s
            }</td><td>${(
      (results.performanceMetrics.responseTimeDistribution.over2s /
        results.testSummary.totalRequests) *
      100
    ).toFixed(1)}%</td></tr>
        </table>

        <h2>测试阶段结果</h2>
        <div class="phase-results">
            ${results.testPhases
              .map(
                (phase) => `
                <div class="phase">
                    <h3>${phase.name}</h3>
                    <p><strong>请求数:</strong> ${phase.requests}</p>
                    <p><strong>平均响应时间:</strong> ${phase.avgResponseTime.toFixed(
                      2
                    )}ms</p>
                    <p><strong>错误数:</strong> ${phase.errors}</p>
                    <p><strong>持续时间:</strong> ${Math.round(
                      (new Date(phase.endTime) - new Date(phase.startTime)) /
                        1000
                    )}秒</p>
                </div>
            `
              )
              .join("")}
        </div>

        <h2>状态码分布</h2>
        <table>
            <tr><th>状态码</th><th>数量</th><th>百分比</th></tr>
            ${Object.entries(results.performanceMetrics.statusCodes)
              .map(
                ([code, count]) => `
                <tr><td>${code}</td><td>${count}</td><td>${(
                  (count / results.testSummary.totalRequests) *
                  100
                ).toFixed(1)}%</td></tr>
            `
              )
              .join("")}
        </table>

        <h2>优化建议</h2>
        <div class="recommendations">
            <ul>
                ${results.recommendations
                  .map((rec) => `<li>${rec}</li>`)
                  .join("")}
            </ul>
        </div>

        ${
          results.performanceMetrics.errors.length > 0
            ? `
        <h2>错误详情</h2>
        <table>
            <tr><th>时间</th><th>错误信息</th></tr>
            ${results.performanceMetrics.errors
              .slice(0, 10)
              .map(
                (error) => `
                <tr><td>${error.timestamp}</td><td>${error.error}</td></tr>
            `
              )
              .join("")}
        </table>
        ${
          results.performanceMetrics.errors.length > 10
            ? `<p>显示前10个错误，总共${results.performanceMetrics.errors.length}个错误</p>`
            : ""
        }
        `
            : ""
        }
    </div>
</body>
</html>`;
  }

  async run() {
    try {
      this.log("开始综合性能测试...");
      this.log(
        `内存限制: ${(this.memoryLimit / 1024 / 1024 / 1024).toFixed(1)}GB`
      );

      await this.runBasicPerformanceTest();
      await this.runLoadTest();
      await this.runSpikeTest();
      await this.runEnduranceTest();

      const report = await this.generateReport();

      this.log("=== 性能测试完成 ===");
      this.log(`总请求数: ${report.testSummary.totalRequests}`);
      this.log(`成功请求: ${report.testSummary.successfulRequests}`);
      this.log(`失败请求: ${report.testSummary.failedRequests}`);
      this.log(
        `平均响应时间: ${report.testSummary.averageResponseTime.toFixed(2)}ms`
      );
      this.log(`吞吐量: ${report.testSummary.throughput.toFixed(2)} req/s`);
      this.log(`错误率: ${report.testSummary.errorRate.toFixed(2)}%`);

      return report;
    } catch (error) {
      this.log(`性能测试失败: ${error.message}`);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const test = new PerformanceTest();
  test.run().catch(console.error);
}

module.exports = { PerformanceTest };
