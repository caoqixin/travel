const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// 导入测试类
const { BrutalStressTest } = require("./brutal-stress-test");
const { DailyUsageTest } = require("./daily-usage-test");
const { HighConcurrencyTest } = require("./high-concurrency-test");
const { PerformanceTest } = require("./performance-test");

class TestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      testResults: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        overallThroughput: 0,
      },
      recommendations: [],
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryLimit: "16GB",
        cpuCount: require("os").cpus().length,
      },
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async runScriptTest(scriptPath, testName) {
    return new Promise((resolve) => {
      this.log(`开始运行 ${testName}...`);
      const startTime = Date.now();

      const child = spawn("node", [scriptPath], {
        cwd: path.dirname(scriptPath),
        stdio: "pipe",
      });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          testName,
          success: code === 0,
          duration,
          output,
          errorOutput,
          exitCode: code,
        };

        this.log(
          `${testName} 完成 - ${
            result.success ? "成功" : "失败"
          } (${duration}ms)`
        );
        resolve(result);
      });

      child.on("error", (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          testName,
          success: false,
          duration,
          output: "",
          errorOutput: error.message,
          exitCode: -1,
        };

        this.log(`${testName} 失败 - ${error.message}`);
        resolve(result);
      });
    });
  }

  async runClassTest(TestClass, testName) {
    try {
      this.log(`开始运行 ${testName}...`);
      const startTime = Date.now();

      const test = new TestClass();
      const result = await test.run();

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.log(`${testName} 完成 - 成功 (${duration}ms)`);

      return {
        testName,
        success: true,
        duration,
        result,
        output: `${testName} 执行成功`,
        errorOutput: "",
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = Date.now() - Date.now();

      this.log(`${testName} 失败 - ${error.message}`);

      return {
        testName,
        success: false,
        duration,
        result: null,
        output: "",
        errorOutput: error.message,
      };
    }
  }

  async checkServerStatus() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds between retries
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await new Promise((resolve) => {
          const http = require("http");
          const req = http.get(
            "http://localhost:3000",
            { timeout: 10000 }, // Increased timeout to 10 seconds
            (res) => {
              resolve(res.statusCode === 200 || res.statusCode === 404);
            }
          );

          req.on("error", () => {
            resolve(false);
          });

          req.on("timeout", () => {
            req.destroy();
            resolve(false);
          });
        });
        
        if (result) {
          return true;
        }
        
        if (attempt < maxRetries) {
          this.log(`服务器检查失败，${retryDelay/1000}秒后重试... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        if (attempt < maxRetries) {
          this.log(`服务器检查出错，${retryDelay/1000}秒后重试... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    return false;
  }

  async runAllTests() {
    try {
      this.log("开始运行所有测试...");
      this.log("检查服务器状态...");

      const serverRunning = await this.checkServerStatus();
      if (!serverRunning) {
        throw new Error("服务器未运行，请先启动服务器 (npm start)");
      }

      this.log("服务器状态正常，开始测试...");

      // 运行脚本测试
      const scriptTests = [
        {
          path: path.join(__dirname, "redirect-test.js"),
          name: "重定向测试",
        },
        {
          path: path.join(__dirname, "admin-access-test.js"),
          name: "管理员访问测试",
        },
      ];

      for (const test of scriptTests) {
        if (fs.existsSync(test.path)) {
          const result = await this.runScriptTest(test.path, test.name);
          this.results.testResults[test.name] = result;
          this.results.summary.totalTests++;
          if (result.success) {
            this.results.summary.passedTests++;
          } else {
            this.results.summary.failedTests++;
          }
        }
      }

      // 运行类测试
      const classTests = [
        { class: PerformanceTest, name: "综合性能测试" },
        { class: DailyUsageTest, name: "日常使用测试" },
        { class: HighConcurrencyTest, name: "高并发测试" },
        { class: BrutalStressTest, name: "深度暴力测试" },
      ];

      for (const test of classTests) {
        const result = await this.runClassTest(test.class, test.name);
        this.results.testResults[test.name] = result;
        this.results.summary.totalTests++;

        if (result.success) {
          this.results.summary.passedTests++;

          // 汇总统计数据
          if (result.result && result.result.testSummary) {
            const summary = result.result.testSummary;
            this.results.summary.totalRequests += summary.totalRequests || 0;
            this.results.summary.totalErrors += summary.failedRequests || 0;

            // 计算加权平均响应时间
            if (summary.averageResponseTime && summary.totalRequests) {
              const currentWeight =
                this.results.summary.totalRequests -
                (summary.totalRequests || 0);
              const newWeight = summary.totalRequests || 0;
              const totalWeight = currentWeight + newWeight;

              if (totalWeight > 0) {
                this.results.summary.averageResponseTime =
                  (this.results.summary.averageResponseTime * currentWeight +
                    summary.averageResponseTime * newWeight) /
                  totalWeight;
              }
            }

            if (summary.throughput) {
              this.results.summary.overallThroughput += summary.throughput;
            }
          }
        } else {
          this.results.summary.failedTests++;
        }
      }

      this.results.endTime = new Date();
      this.generateRecommendations();
      await this.generateReport();

      this.log("=== 所有测试完成 ===");
      this.log(`总测试数: ${this.results.summary.totalTests}`);
      this.log(`通过测试: ${this.results.summary.passedTests}`);
      this.log(`失败测试: ${this.results.summary.failedTests}`);
      this.log(`总请求数: ${this.results.summary.totalRequests}`);
      this.log(`总错误数: ${this.results.summary.totalErrors}`);
      this.log(
        `平均响应时间: ${this.results.summary.averageResponseTime.toFixed(2)}ms`
      );
      this.log(
        `总吞吐量: ${this.results.summary.overallThroughput.toFixed(2)} req/s`
      );

      return this.results;
    } catch (error) {
      this.log(`测试运行失败: ${error.message}`);
      throw error;
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const summary = this.results.summary;

    // 测试通过率建议
    const passRate = (summary.passedTests / summary.totalTests) * 100;
    if (passRate < 80) {
      recommendations.push("测试通过率较低，需要检查失败的测试并修复问题");
    } else if (passRate === 100) {
      recommendations.push("所有测试通过，系统状态良好");
    }

    // 响应时间建议
    if (summary.averageResponseTime > 2000) {
      recommendations.push("平均响应时间过长，建议优化服务器性能和数据库查询");
    } else if (summary.averageResponseTime < 200) {
      recommendations.push("响应时间优秀，系统性能良好");
    }

    // 错误率建议
    const errorRate =
      summary.totalRequests > 0
        ? (summary.totalErrors / summary.totalRequests) * 100
        : 0;
    if (errorRate > 5) {
      recommendations.push("错误率过高，需要检查系统稳定性");
    } else if (errorRate < 1) {
      recommendations.push("错误率很低，系统稳定性良好");
    }

    // 吞吐量建议
    if (summary.overallThroughput < 50) {
      recommendations.push("系统吞吐量较低，考虑优化并发处理能力");
    } else if (summary.overallThroughput > 200) {
      recommendations.push("系统吞吐量优秀，并发处理能力强");
    }

    // 上线建议
    if (passRate >= 90 && errorRate < 2 && summary.averageResponseTime < 1000) {
      recommendations.push("✅ 系统已准备好上线，各项指标均达到要求");
    } else {
      recommendations.push("⚠️ 建议在上线前解决发现的性能和稳定性问题");
    }

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    const reportPath = path.join(
      __dirname,
      "..",
      "comprehensive-test-report.json"
    );
    const htmlReportPath = path.join(
      __dirname,
      "..",
      "comprehensive-test-report.html"
    );

    // 生成JSON报告
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);

    this.log(`综合测试报告已生成:`);
    this.log(`- JSON报告: ${reportPath}`);
    this.log(`- HTML报告: ${htmlReportPath}`);
  }

  generateHtmlReport() {
    const results = this.results;
    const testDuration = (results.endTime - results.startTime) / 1000;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>综合测试报告</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .metric-card.success { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .metric-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .metric-card.error { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .metric-label { font-size: 1.1em; opacity: 0.9; }
        .test-results { margin: 30px 0; }
        .test-item { background: #f8f9fa; margin: 15px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }
        .test-header { padding: 20px; background: #fff; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; }
        .test-name { font-size: 1.2em; font-weight: 600; color: #333; }
        .test-status { padding: 5px 15px; border-radius: 20px; color: white; font-weight: 500; }
        .test-status.success { background: #28a745; }
        .test-status.failed { background: #dc3545; }
        .test-details { padding: 20px; background: #f8f9fa; }
        .recommendations { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 25px; border-radius: 10px; margin: 30px 0; }
        .recommendations h3 { margin-top: 0; color: #333; }
        .recommendations ul { margin: 15px 0; }
        .recommendations li { margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 5px; }
        .system-info { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 网站上线综合测试报告</h1>
            <p>测试时间: ${results.startTime.toLocaleString()} - ${results.endTime.toLocaleString()}</p>
            <p>测试持续时间: ${Math.round(testDuration)}秒</p>
        </div>
        
        <div class="content">
            <h2>📊 测试概览</h2>
            <div class="summary-grid">
                <div class="metric-card ${
                  results.summary.passedTests === results.summary.totalTests
                    ? "success"
                    : results.summary.failedTests > 0
                    ? "error"
                    : "warning"
                }">
                    <div class="metric-value">${
                      results.summary.totalTests
                    }</div>
                    <div class="metric-label">总测试数</div>
                </div>
                <div class="metric-card ${
                  results.summary.passedTests === results.summary.totalTests
                    ? "success"
                    : "warning"
                }">
                    <div class="metric-value">${
                      results.summary.passedTests
                    }</div>
                    <div class="metric-label">通过测试</div>
                </div>
                <div class="metric-card ${
                  results.summary.failedTests === 0 ? "success" : "error"
                }">
                    <div class="metric-value">${
                      results.summary.failedTests
                    }</div>
                    <div class="metric-label">失败测试</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.summary.totalRequests.toLocaleString()}</div>
                    <div class="metric-label">总请求数</div>
                </div>
                <div class="metric-card ${
                  results.summary.averageResponseTime < 500
                    ? "success"
                    : results.summary.averageResponseTime < 1000
                    ? "warning"
                    : "error"
                }">
                    <div class="metric-value">${results.summary.averageResponseTime.toFixed(
                      0
                    )}ms</div>
                    <div class="metric-label">平均响应时间</div>
                </div>
                <div class="metric-card ${
                  results.summary.overallThroughput > 100
                    ? "success"
                    : "warning"
                }">
                    <div class="metric-value">${results.summary.overallThroughput.toFixed(
                      1
                    )}</div>
                    <div class="metric-label">总吞吐量 (req/s)</div>
                </div>
            </div>

            <h2>🧪 测试结果详情</h2>
            <div class="test-results">
                ${Object.entries(results.testResults)
                  .map(
                    ([testName, result]) => `
                    <div class="test-item">
                        <div class="test-header">
                            <div class="test-name">${testName}</div>
                            <div class="test-status ${
                              result.success ? "success" : "failed"
                            }">
                                ${result.success ? "✅ 通过" : "❌ 失败"}
                            </div>
                        </div>
                        <div class="test-details">
                            <p><strong>执行时间:</strong> ${
                              result.duration
                            }ms</p>
                            ${
                              result.result && result.result.testSummary
                                ? `
                                <p><strong>请求数:</strong> ${
                                  result.result.testSummary.totalRequests || 0
                                }</p>
                                <p><strong>成功率:</strong> ${
                                  result.result.testSummary.totalRequests
                                    ? (
                                        (result.result.testSummary
                                          .successfulRequests /
                                          result.result.testSummary
                                            .totalRequests) *
                                        100
                                      ).toFixed(1)
                                    : 0
                                }%</p>
                                <p><strong>平均响应时间:</strong> ${
                                  result.result.testSummary.averageResponseTime
                                    ? result.result.testSummary.averageResponseTime.toFixed(
                                        2
                                      )
                                    : 0
                                }ms</p>
                            `
                                : ""
                            }
                            ${
                              result.errorOutput
                                ? `<p><strong>错误信息:</strong> ${result.errorOutput}</p>`
                                : ""
                            }
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>

            <div class="recommendations">
                <h3>💡 优化建议与上线评估</h3>
                <ul>
                    ${results.recommendations
                      .map((rec) => `<li>${rec}</li>`)
                      .join("")}
                </ul>
            </div>

            <div class="system-info">
                <h3>🖥️ 系统信息</h3>
                <p><strong>Node.js版本:</strong> ${
                  results.systemInfo.nodeVersion
                }</p>
                <p><strong>平台:</strong> ${results.systemInfo.platform} (${
      results.systemInfo.arch
    })</p>
                <p><strong>CPU核心数:</strong> ${
                  results.systemInfo.cpuCount
                }</p>
                <p><strong>内存限制:</strong> ${
                  results.systemInfo.memoryLimit
                }</p>
            </div>
        </div>

        <div class="footer">
            <p>报告生成时间: ${new Date().toLocaleString()}</p>
            <p>LunaTech Travel - 网站上线测试报告</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;
