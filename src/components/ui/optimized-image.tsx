"use client";

import { useState, useCallback } from "react";
import Image, { ImageProps, StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

// 定义图片源的类型，包含 Next.js 支持的所有类型
type ImageSrc = string | StaticImageData;

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  showLoader?: boolean;
  loaderClassName?: string;
  errorClassName?: string;
}

const defaultBlurDataURL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.svg",
  showLoader = true,
  loaderClassName,
  errorClassName,
  className,
  placeholder = "blur",
  blurDataURL = defaultBlurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<ImageSrc>(src as ImageSrc);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (
      fallbackSrc &&
      typeof imageSrc === "string" &&
      imageSrc !== fallbackSrc
    ) {
      setImageSrc(fallbackSrc);
      setHasError(false); // Reset error state when switching to fallback
    }
  }, [fallbackSrc, imageSrc, hasError]);

  // 对于 SVG 文件，使用普通的 img 标签
  // 确保 imageSrc 是字符串类型才调用 endsWith
  if (typeof imageSrc === "string" && imageSrc.endsWith(".svg")) {
    return (
      <div className="relative">
        <img
          src={imageSrc as string}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoading && "opacity-0",
            hasError && errorClassName,
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {/* 加载状态 */}
        {isLoading && showLoader && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse",
              loaderClassName
            )}
          >
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* 错误状态 */}
        {hasError && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400",
              errorClassName
            )}
          >
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs">图片加载失败</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading && "opacity-0",
          hasError && errorClassName,
          className
        )}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* 加载状态 */}
      {isLoading && showLoader && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse",
            loaderClassName
          )}
        >
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400",
            errorClassName
          )}
        >
          <div className="text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  );
}
