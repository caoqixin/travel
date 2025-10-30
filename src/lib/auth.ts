import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "development" && !process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

// 创建 MongoDB 客户端和数据库实例
const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db(process.env.MONGODB_DB!);

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ password, hash }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here",
});

export async function getServerSession() {
  const { headers } = await import("next/headers");

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}
