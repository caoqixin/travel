// 测试 Better Auth 登录功能
require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});

const testLogin = async () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@lunatech.net";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  try {
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

    const text = await response.text();
    console.log("原始响应:", text);
    console.log("响应状态:", response.status);

    let result;
    try {
      result = JSON.parse(text);
      console.log("解析后的响应:", result);
    } catch (e) {
      console.log("无法解析为 JSON");
    }

    if (response.ok) {
      console.log("✅ 登录成功");
    } else {
      console.log("❌ 登录失败");
    }
  } catch (error) {
    console.error("登录错误:", error);
  }
};

testLogin();
