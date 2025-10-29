import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 配置
export const r2Config = {
  region: 'auto', // Cloudflare R2 使用 'auto' 作为区域
  endpoint: process.env.R2_ENDPOINT, // 例如: https://your-account-id.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // R2 需要路径样式的URL
};

// 创建 S3 客户端实例
export const r2Client = new S3Client(r2Config);

// R2 存储桶配置
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // 可选：自定义域名

// 图片配置
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
};

// 生成唯一文件名
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  return `flights/${timestamp}-${randomString}${extension}`;
}

// 获取图片的公共URL
export function getImagePublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  // 如果没有自定义域名，使用R2的默认URL
  return `${process.env.R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}