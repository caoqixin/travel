// 加载环境变量
require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});

// 使用内置的 fetch API (Node.js 18+)
async function createAdminViaAPI() {
  try {
    console.log("🚀 使用 Better Auth API 创建管理员账户...");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lunatech.net";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
    const adminName = process.env.ADMIN_NAME || "Administrator";

    const response = await fetch(`${appUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      }),
    });

    const responseText = await response.text();
    console.log("📊 响应状态:", response.status);
    console.log("📋 响应头:", Object.fromEntries(response.headers.entries()));
    console.log("📄 原始响应:", responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log("✅ 管理员账户创建成功!");
      console.log("📦 响应数据:", data);
    } else {
      console.log("❌ 管理员账户创建失败");
      try {
        const errorData = JSON.parse(responseText);
        console.log("📦 错误数据:", errorData);
      } catch (e) {
        console.log("📦 无法解析错误响应");
      }
    }
  } catch (error) {
    console.error("💥 创建管理员账户时发生错误:", error);
  }
}

createAdminViaAPI();
