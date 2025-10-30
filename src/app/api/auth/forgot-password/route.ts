import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getDatabase } from "@/lib/mongodb";
import { IUser, USER_COLLECTION } from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱为必填项" }, { status: 400 });
    }

    // 连接数据库
    const db = await getDatabase();
    const collection = db.collection<IUser>(USER_COLLECTION);

    // 查找用户
    const user = await collection.findOne({ email });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return NextResponse.json({
        message: "如果该邮箱存在，重置链接已发送",
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1小时后过期

    // 保存重置令牌
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
          updatedAt: new Date(),
        },
      }
    );

    // 发送邮件（这里只是示例，实际需要配置邮件服务）
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 发送邮件
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "密码重置",
      html: `
        <h1>密码重置</h1>
        <p>您请求重置密码。请点击下面的链接重置您的密码：</p>
        <a href="${resetUrl}">重置密码</a>
        <p>此链接将在1小时后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
      `,
    });

    return NextResponse.json({
      message: "如果该邮箱存在，重置链接已发送",
    });
  } catch {
    return NextResponse.json(
      { error: "发送重置邮件失败，请重试" },
      { status: 500 }
    );
  }
}
