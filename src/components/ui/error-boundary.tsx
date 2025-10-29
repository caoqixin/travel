"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">出现了一些问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            很抱歉，页面遇到了错误。请尝试刷新页面或返回首页。
          </p>
          
          {process.env.NODE_ENV === "development" && error && (
            <details className="bg-gray-100 p-3 rounded text-xs">
              <summary className="cursor-pointer font-medium">错误详情</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleRefresh} 
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新页面
            </Button>
            <Button 
              onClick={handleGoHome} 
              className="flex-1"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 网络错误组件
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800">网络连接异常</h3>
            <p className="text-xs text-orange-700 mt-1">
              请检查网络连接后重试
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onRetry}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            重试
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 数据加载失败组件
export function DataLoadError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
        {message || "无法获取数据，请稍后重试"}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        重新加载
      </Button>
    </div>
  );
}

export default ErrorBoundary;