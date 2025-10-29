const baseUrl = "http://localhost:3000";

async function testRoute(path, expectedRedirect = null) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual", // 不自动跟随重定向
    });

    if (expectedRedirect) {
      if (response.status === 307 || response.status === 308) {
        const location = response.headers.get("location");
        const redirectUrl = location?.replace(baseUrl, "") || location;
        console.log(`✅ ${path} → 重定向到: ${redirectUrl}`);
        return redirectUrl === expectedRedirect;
      } else {
        console.log(`❌ ${path} → 期望重定向但得到状态码: ${response.status}`);
        return false;
      }
    } else {
      if (response.status === 200 || response.status === 404) {
        console.log(`✅ ${path} → 正常访问 (状态码: ${response.status})`);
        return true;
      } else {
        console.log(`❌ ${path} → 意外状态码: ${response.status}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ ${path} → 请求失败: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🧪 测试404重定向功能...\n");

  const tests = [
    // 有效路由 - 应该正常访问
    { path: "/", expected: null, description: "首页" },
    { path: "/flights", expected: null, description: "航班页面" },

    // 无效路由 - 应该重定向到首页
    { path: "/about", expected: "/", description: "关于页面(不存在)" },
    { path: "/contact", expected: "/", description: "联系页面(不存在)" },
    { path: "/services", expected: "/", description: "服务页面(不存在)" },
    { path: "/blog", expected: "/", description: "博客页面(不存在)" },
    { path: "/products", expected: "/", description: "产品页面(不存在)" },
    { path: "/random-page", expected: "/", description: "随机页面(不存在)" },
    {
      path: "/user/profile",
      expected: "/",
      description: "用户资料页面(不存在)",
    },
    { path: "/settings", expected: "/", description: "设置页面(不存在)" },
    { path: "/help", expected: "/", description: "帮助页面(不存在)" },
    { path: "/404", expected: "/", description: "404页面" },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`📋 测试: ${test.description}`);
    const result = await testRoute(test.path, test.expected);
    if (result) {
      passedTests++;
    }
    console.log("");
  }

  console.log(`🎯 测试结果: ${passedTests}/${totalTests} 通过`);

  if (passedTests === totalTests) {
    console.log("🎉 所有404重定向测试通过！");
  } else {
    console.log("⚠️ 部分测试失败，请检查中间件配置");
  }
}

runTests().catch(console.error);
