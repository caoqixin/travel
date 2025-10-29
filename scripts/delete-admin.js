// 加载环境变量
require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});

// 使用 MongoDB 工具删除管理员数据
async function deleteAdminData() {
  try {
    console.log("🗑️ 删除现有管理员数据...");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lunatech.net";

    // 使用 MongoDB 工具删除用户
    const userDeleteResult = await fetch(`${appUrl}/api/admin/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
      }),
    });

    console.log("📊 用户删除响应状态:", userDeleteResult.status);

    if (userDeleteResult.ok) {
      console.log("✅ 用户删除成功");
    } else {
      console.log("❌ 用户删除失败");
    }
  } catch (error) {
    console.error("💥 删除管理员数据时发生错误:", error);
  }
}

deleteAdminData();
