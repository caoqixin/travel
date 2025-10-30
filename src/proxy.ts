import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 处理 /admin 路径下的请求
  if (pathname.startsWith("/admin")) {
    return handleAdminRoutes(request);
  }

  // 定义有效的路由模式
  const validRoutes = [
    "/", // 首页
    "/flights", // 航班页面
    "/flights/", // 航班页面（带斜杠）
  ];

  // 检查是否是有效路由
  const isValidRoute =
    validRoutes.includes(pathname) || // 精确匹配
    pathname.startsWith("/flights/");

  // 如果不是有效路由，重定向到首页
  if (!isValidRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

async function handleAdminRoutes(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 检查admin访问密钥
  const accessKeyCookie = request.cookies.get("admin-access-key");
  const hasValidAccessKey =
    accessKeyCookie?.value === process.env.ADMIN_ACCESS_KEY;

  // 检查用户认证状态
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  // 定义特殊页面
  const isAccessPage = pathname === "/admin/access";
  const isLoginPage = pathname === "/admin/login";
  const isForgotPasswordPage = pathname === "/admin/forgot-password";
  const isResetPasswordPage = pathname === "/admin/reset-password";

  // 如果访问密钥输入页面，直接允许
  if (isAccessPage) {
    return NextResponse.next();
  }

  // 如果没有有效的访问密钥，重定向到密钥输入页面
  if (!hasValidAccessKey) {
    const accessUrl = new URL("/admin/access", request.url);
    accessUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(accessUrl);
  }

  // 有访问密钥后，处理用户认证逻辑

  // 如果已登录且访问登录页面，重定向到仪表板
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 如果未登录且访问受保护的管理页面，重定向到登录页
  if (
    !isAuthenticated &&
    !isLoginPage &&
    !isForgotPasswordPage &&
    !isResetPasswordPage
  ) {
    const loginUrl = new URL("/admin/login", request.url);
    // 保存原始URL作为回调参数
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/flights/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
