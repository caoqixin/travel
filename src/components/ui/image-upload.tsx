"use client";

import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  // 新增：预览模式，选择图片时只显示预览不上传
  previewMode?: boolean;
  // 新增：当选择文件时的回调，用于预览模式
  onFileSelect?: (file: File) => void;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  className = "",
  previewMode = false,
  onFileSelect,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadImage, deleteImage } = useImageUpload();
  const [imageKey, setImageKey] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewMode) {
      // 预览模式：只显示预览，不上传
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onChange(url); // 传递预览URL给表单

      // 调用回调函数，让父组件知道文件已选择
      if (onFileSelect) {
        onFileSelect(file);
      }
    } else {
      // 正常模式：立即上传
      const result = await uploadImage(file);
      if (result?.url) {
        onChange(result.url);
        if (result.key) {
          setImageKey(result.key);
        }
      }
    }

    // 清空input值，允许重新选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (previewMode) {
      // 预览模式：清理预览状态
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewFile(null);
      setPreviewUrl("");
    } else {
      // 正常模式：删除已上传的图片
      if (imageKey) {
        await deleteImage(imageKey);
      }
      setImageKey("");
    }

    onChange("");
    if (onRemove) {
      onRemove();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value || previewUrl ? (
        <div className="relative group">
          <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img
              src={previewUrl || value}
              alt="上传的图片"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={triggerFileSelect}
          className={`
            w-full h-48 border-2 border-dashed border-gray-300 rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer hover:border-gray-400 transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${uploading ? "opacity-50" : ""}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  点击上传图片
                </p>
                <p className="text-xs text-gray-500">
                  支持 JPG, PNG, WebP, SVG 格式
                </p>
                <p className="text-xs text-gray-500">最大 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={disabled || uploading}
          className="flex items-center space-x-2"
        >
          <ImageIcon className="h-4 w-4" />
          <span>{value || previewUrl ? "更换图片" : "选择图片"}</span>
        </Button>

        {(value || previewUrl) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>移除</span>
          </Button>
        )}
      </div>
    </div>
  );
}
