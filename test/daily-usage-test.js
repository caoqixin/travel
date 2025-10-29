#!/usr/bin/env node

/**
 * 日常使用测试脚本
 * 模拟真实用户的日常使用场景和行为模式
 */

const http = require("http");
const { performance } = require("perf_hooks");

const BASE_URL = "http://localhost:3000";

class DailyUsageTest {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      scenarios: [],
      totalUsers: 0,
      totalSessions: 0,
      totalPageViews: 0,
      errors: [],
      performance: {
        averageSessionDuration: 0,
        averagePageLoadTime: 0,
        bounceRate: 0,
        conversionRate: 0,
      },
    };
    this.activeUsers = 0;
  }

  // 发送HTTP请求
  async makeRequest(url, method = "GET", data = null, headers = {}) {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const options = {
        method,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          Connection: "keep-alive",
          ...headers,
        },
      };

      if (data) {
        options.headers["Content-Type"] = "application/json";
        options.headers["Content-Length"] = Buffer.byteLength(
          JSON.stringify(data)
        );
      }

      const req = http.request(url, options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            responseTime,
            dataSize: responseData.length,
            data: responseData,
          });
        });
      });

      req.on("error", (error) => {
        this.results.errors.push({
          error: error.message,
          url,
          timestamp: Date.now(),
        });
        resolve({
          success: false,
          error: error.message,
          responseTime: performance.now() - startTime,
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // 模拟用户会话
  async simulateUserSession(userId, sessionType = "normal") {
    const session = {
      userId,
      sessionType,
      startTime: Date.now(),
      endTime: null,
      pageViews: [],
      actions: [],
      success: false,
    };

    this.activeUsers++;
    console.log(`👤 用户 ${userId} 开始 ${sessionType} 会话`);

    try {
      switch (sessionType) {
        case "browser":
          await this.browserSession(session);
          break;
        case "searcher":
          await this.searcherSession(session);
          break;
        case "admin":
          await this.adminSession(session);
          break;
        case "mobile":
          await this.mobileSession(session);
          break;
        default:
          await this.normalSession(session);
      }
      session.success = true;
    } catch (error) {
      console.error(`用户 ${userId} 会话出错:`, error.message);
      this.results.errors.push({
        userId,
        sessionType,
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      session.endTime = Date.now();
      this.results.scenarios.push(session);
      this.activeUsers--;
      console.log(
        `✅ 用户 ${userId} 会话结束 (${(
          (session.endTime - session.startTime) /
          1000
        ).toFixed(1)}s)`
      );
    }

    return session;
  }

  // 普通浏览会话
  async normalSession(session) {
    // 访问首页
    const homeResult = await this.makeRequest(`${BASE_URL}/`);
    session.pageViews.push({ page: "home", ...homeResult });
    await this.randomDelay(2000, 5000); // 用户阅读时间

    if (Math.random() > 0.3) {
      // 70%的用户会继续浏览
      // 查看航班列表
      const flightsResult = await this.makeRequest(`${BASE_URL}/flights`);
      session.pageViews.push({ page: "flights", ...flightsResult });
      await this.randomDelay(3000, 8000);

      if (Math.random() > 0.5) {
        // 50%的用户会搜索
        // 搜索航班
        const searchResult = await this.makeRequest(
          `${BASE_URL}/api/flights?from=北京&to=上海`
        );
        session.actions.push({ action: "search", ...searchResult });
        await this.randomDelay(1000, 3000);
      }
    }
  }

  // 搜索用户会话
  async searcherSession(session) {
    // 直接访问首页并搜索
    const homeResult = await this.makeRequest(`${BASE_URL}/`);
    session.pageViews.push({ page: "home", ...homeResult });
    await this.randomDelay(1000, 2000);

    // 执行多次搜索
    const searchQueries = [
      "from=北京&to=上海",
      "from=广州&to=深圳",
      "from=成都&to=重庆",
      "from=杭州&to=南京",
    ];

    for (let i = 0; i < Math.min(3, searchQueries.length); i++) {
      const query =
        searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const searchResult = await this.makeRequest(
        `${BASE_URL}/api/flights?${query}`
      );
      session.actions.push({ action: "search", query, ...searchResult });
      await this.randomDelay(2000, 5000);
    }
  }

  // 管理员会话
  async adminSession(session) {
    // 访问管理员登录页
    const loginPageResult = await this.makeRequest(`${BASE_URL}/admin/login`);
    session.pageViews.push({ page: "admin_login", ...loginPageResult });
    await this.randomDelay(2000, 4000);

    // 尝试访问管理页面（会被重定向）
    const dashboardResult = await this.makeRequest(
      `${BASE_URL}/admin/dashboard`
    );
    session.pageViews.push({ page: "admin_dashboard", ...dashboardResult });
    await this.randomDelay(1000, 2000);

    // 访问航班管理API
    const flightsApiResult = await this.makeRequest(
      `${BASE_URL}/api/admin/flights`
    );
    session.actions.push({ action: "admin_api_access", ...flightsApiResult });
    await this.randomDelay(1000, 3000);
  }

  // 移动端会话
  async mobileSession(session) {
    const mobileHeaders = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
    };

    // 移动端访问首页
    const homeResult = await this.makeRequest(
      `${BASE_URL}/`,
      "GET",
      null,
      mobileHeaders
    );
    session.pageViews.push({ page: "mobile_home", ...homeResult });
    await this.randomDelay(1000, 3000);

    // 快速搜索（移动端用户更倾向于快速操作）
    const searchResult = await this.makeRequest(
      `${BASE_URL}/api/flights?from=北京&to=上海`,
      "GET",
      null,
      mobileHeaders
    );
    session.actions.push({ action: "mobile_search", ...searchResult });
    await this.randomDelay(500, 2000);
  }

  // 浏览器会话（深度浏览）
  async browserSession(session) {
    // 访问多个页面
    const pages = [
      { url: `${BASE_URL}/`, name: "home" },
      { url: `${BASE_URL}/flights`, name: "flights" },
      { url: `${BASE_URL}/admin/login`, name: "admin_login" },
      { url: `${BASE_URL}/admin/access`, name: "admin_access" },
    ];

    for (const page of pages) {
      const result = await this.makeRequest(page.url);
      session.pageViews.push({ page: page.name, ...result });
      await this.randomDelay(3000, 7000); // 深度浏览用户停留时间更长
    }

    // 执行一些API调用
    const apiResult = await this.makeRequest(`${BASE_URL}/api/flights`);
    session.actions.push({ action: "api_call", ...apiResult });
  }

  // 随机延迟（模拟用户思考时间）
  async randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // 运行日常使用测试
  async runDailyUsageTest(duration = 300000) {
    // 默认5分钟
    console.log("📱 开始日常使用测试...");
    console.log(`测试时长: ${duration / 1000 / 60} 分钟`);

    this.results.startTime = new Date();
    const startTime = Date.now();
    const userPromises = [];

    // 用户类型分布
    const userTypes = [
      { type: "normal", weight: 40 }, // 40% 普通用户
      { type: "searcher", weight: 30 }, // 30% 搜索用户
      { type: "browser", weight: 20 }, // 20% 深度浏览用户
      { type: "mobile", weight: 8 }, // 8% 移动端用户
      { type: "admin", weight: 2 }, // 2% 管理员用户
    ];

    let userId = 1;

    while (Date.now() - startTime < duration) {
      // 控制并发用户数（模拟真实流量）
      const maxConcurrentUsers = 20;
      if (this.activeUsers < maxConcurrentUsers) {
        // 根据权重选择用户类型
        const randomValue = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedType = "normal";

        for (const userType of userTypes) {
          cumulativeWeight += userType.weight;
          if (randomValue <= cumulativeWeight) {
            selectedType = userType.type;
            break;
          }
        }

        // 创建用户会话
        const userPromise = this.simulateUserSession(userId++, selectedType);
        userPromises.push(userPromise);
        this.results.totalUsers++;
      }

      // 模拟真实的用户到达间隔（泊松分布）
      const arrivalInterval = -Math.log(Math.random()) * 2000; // 平均2秒一个用户
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(arrivalInterval, 5000))
      );
    }

    // 等待所有用户会话完成
    console.log("⏳ 等待所有用户会话完成...");
    await Promise.all(userPromises);

    this.results.endTime = new Date();
    return this.generateReport();
  }

  // 生成报告
  generateReport() {
    const duration = this.results.endTime - this.results.startTime;
    this.results.totalSessions = this.results.scenarios.length;

    // 计算统计数据
    let totalSessionDuration = 0;
    let totalPageLoadTime = 0;
    let totalPageViews = 0;
    let successfulSessions = 0;
    let bounces = 0; // 只访问一个页面的会话

    this.results.scenarios.forEach((session) => {
      if (session.success) successfulSessions++;

      const sessionDuration = session.endTime - session.startTime;
      totalSessionDuration += sessionDuration;

      totalPageViews += session.pageViews.length;

      if (session.pageViews.length <= 1) {
        bounces++;
      }

      session.pageViews.forEach((pageView) => {
        if (pageView.responseTime) {
          totalPageLoadTime += pageView.responseTime;
        }
      });
    });

    this.results.totalPageViews = totalPageViews;
    this.results.performance.averageSessionDuration =
      totalSessionDuration / this.results.totalSessions;
    this.results.performance.averagePageLoadTime =
      totalPageLoadTime / totalPageViews;
    this.results.performance.bounceRate =
      (bounces / this.results.totalSessions) * 100;
    this.results.performance.conversionRate =
      (successfulSessions / this.results.totalSessions) * 100;

    const report = {
      testType: "daily_usage_test",
      summary: {
        duration: duration,
        totalUsers: this.results.totalUsers,
        totalSessions: this.results.totalSessions,
        totalPageViews: this.results.totalPageViews,
        successfulSessions: successfulSessions,
        errorCount: this.results.errors.length,
      },
      performance: {
        averageSessionDuration: (
          this.results.performance.averageSessionDuration / 1000
        ).toFixed(2),
        averagePageLoadTime:
          this.results.performance.averagePageLoadTime.toFixed(2),
        bounceRate: this.results.performance.bounceRate.toFixed(2),
        conversionRate: this.results.performance.conversionRate.toFixed(2),
      },
      userBehavior: this.analyzeUserBehavior(),
      errors: this.results.errors.slice(0, 10),
      recommendations: this.generateRecommendations(),
    };

    console.log("\n📊 日常使用测试报告:");
    console.log(`测试时长: ${(duration / 1000 / 60).toFixed(2)} 分钟`);
    console.log(`总用户数: ${report.summary.totalUsers}`);
    console.log(`总会话数: ${report.summary.totalSessions}`);
    console.log(`总页面浏览: ${report.summary.totalPageViews}`);
    console.log(`平均会话时长: ${report.performance.averageSessionDuration}s`);
    console.log(
      `平均页面加载时间: ${report.performance.averagePageLoadTime}ms`
    );
    console.log(`跳出率: ${report.performance.bounceRate}%`);
    console.log(`转化率: ${report.performance.conversionRate}%`);

    return report;
  }

  analyzeUserBehavior() {
    const behavior = {
      sessionTypes: {},
      popularPages: {},
      commonActions: {},
    };

    this.results.scenarios.forEach((session) => {
      // 会话类型统计
      behavior.sessionTypes[session.sessionType] =
        (behavior.sessionTypes[session.sessionType] || 0) + 1;

      // 页面访问统计
      session.pageViews.forEach((pageView) => {
        behavior.popularPages[pageView.page] =
          (behavior.popularPages[pageView.page] || 0) + 1;
      });

      // 用户行为统计
      session.actions.forEach((action) => {
        behavior.commonActions[action.action] =
          (behavior.commonActions[action.action] || 0) + 1;
      });
    });

    return behavior;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.performance.bounceRate > 50) {
      recommendations.push("跳出率较高，建议优化首页内容和用户体验");
    }

    if (this.results.performance.averagePageLoadTime > 2000) {
      recommendations.push("页面加载时间较长，建议优化前端性能");
    }

    if (this.results.performance.conversionRate < 80) {
      recommendations.push("转化率较低，建议检查用户流程和错误处理");
    }

    if (this.results.errors.length > this.results.totalSessions * 0.05) {
      recommendations.push("错误率较高，建议加强错误监控和处理");
    }

    return recommendations;
  }

  async run() {
    return await this.runDailyUsageTest(300000); // 5分钟测试
  }
}

// 主函数
async function main() {
  const tester = new DailyUsageTest();

  try {
    const report = await tester.runDailyUsageTest(300000); // 5分钟测试

    // 保存报告
    const fs = require("fs");
    const reportPath = "daily-usage-test-report.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);

    return report;
  } catch (error) {
    console.error("测试失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { DailyUsageTest };
