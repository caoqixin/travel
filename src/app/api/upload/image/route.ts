import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, IMAGE_CONFIG, generateUniqueFileName, getImagePublicUrl } from '@/lib/r2-config';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型。支持的格式：JPG, PNG, WebP, SVG' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > IMAGE_CONFIG.maxSize) {
      return NextResponse.json(
        { error: `文件大小超过限制。最大允许 ${IMAGE_CONFIG.maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileName = generateUniqueFileName(file.name);
    
    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
      // 设置缓存控制
      CacheControl: 'public, max-age=31536000', // 1年缓存
      // 设置元数据
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(uploadCommand);

    // 生成公共访问URL
    const publicUrl = getImagePublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: '图片上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 删除图片的API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: '缺少文件key参数' },
        { status: 400 }
      );
    }

    // 从 R2 删除文件
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      message: '图片删除成功',
    });

  } catch (error) {
    console.error('图片删除失败:', error);
    return NextResponse.json(
      { error: '图片删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}