// 加载环境变量
require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});

// 测试管理员登录功能
const testAdminLogin = async () => {
  try {
    console.log("🧪 测试管理员登录功能...");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lunatech.net";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

    const response = await fetch(`${appUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    console.log("📊 响应状态:", response.status);
    console.log("📋 响应头:", Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log("📄 原始响应:", text);

    let result;
    try {
      result = JSON.parse(text);
      console.log("📦 解析后的响应:", result);
    } catch (e) {
      console.log("⚠️  无法解析为 JSON，可能是HTML响应");
    }

    if (response.ok) {
      console.log("✅ 登录成功!");
      if (result && result.user) {
        console.log("👤 用户信息:", result.user);
      }
    } else {
      console.log("❌ 登录失败");
      if (result && result.error) {
        console.log("🚫 错误信息:", result.error);
      }
    }
  } catch (error) {
    console.error("💥 登录测试错误:", error);
  }
};

testAdminLogin();
