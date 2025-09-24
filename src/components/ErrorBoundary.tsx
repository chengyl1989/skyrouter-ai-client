'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
<<<<<<< HEAD
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 text-center animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
=======
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
>>>>>>> 084e249abd7dd6ac615471643934f3b127348ab0
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

<<<<<<< HEAD
            <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
              哎呀，出错了！
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
=======
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              哎呀，出错了！
            </h1>

            <p className="text-gray-600 mb-6">
>>>>>>> 084e249abd7dd6ac615471643934f3b127348ab0
              应用程序遇到了意外错误，请尝试刷新页面或返回首页。
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 button-press focus-ring"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </button>

              <button
                onClick={this.handleGoHome}
<<<<<<< HEAD
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 button-press focus-ring"
=======
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 button-press focus-ring"
>>>>>>> 084e249abd7dd6ac615471643934f3b127348ab0
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>

              <button
                onClick={this.handleReset}
<<<<<<< HEAD
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
=======
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
>>>>>>> 084e249abd7dd6ac615471643934f3b127348ab0
              >
                尝试恢复
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
<<<<<<< HEAD
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32">
=======
                <summary className="text-sm text-gray-500 cursor-pointer">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
>>>>>>> 084e249abd7dd6ac615471643934f3b127348ab0
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}