import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UploadResponse {
  success: boolean;
  url?: string;
  key?: string;
  originalName?: string;
  size?: number;
  type?: string;
  error?: string;
}

interface UseImageUploadReturn {
  uploading: boolean;
  uploadImage: (file: File) => Promise<UploadResponse | null>;
  deleteImage: (key: string) => Promise<boolean>;
}

export function useImageUpload(): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (file: File): Promise<UploadResponse | null> => {
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

  const deleteImage = useCallback(async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload/image?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('图片删除成功');
        return true;
      } else {
        toast.error(result.error || '图片删除失败');
        return false;
      }
    } catch (error) {
      console.error('删除错误:', error);
      toast.error('图片删除失败，请稍后重试');
      return false;
    }
  }, []);

  return {
    uploading,
    uploadImage,
    deleteImage,
  };
}