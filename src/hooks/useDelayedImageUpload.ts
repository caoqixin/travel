"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  originalName?: string;
  size?: number;
  type?: string;
  error?: string;
}

interface UseDelayedImageUploadReturn {
  uploading: boolean;
  uploadImageFile: (file: File) => Promise<UploadResponse | null>;
}

export function useDelayedImageUpload(): UseDelayedImageUploadReturn {
  const [uploading, setUploading] = useState(false);

  const uploadImageFile = useCallback(async (file: File): Promise<UploadResponse | null> => {
    if (!file) {
      toast.error('请选择一个文件');
      return null;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success && result.url) {
        toast.success('图片上传成功');
        return result;
      } else {
        toast.error(result.error || '图片上传失败');
        return null;
      }
    } catch (error) {
      console.error('上传错误:', error);
      toast.error('图片上传失败，请稍后重试');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    uploadImageFile,
  };
}