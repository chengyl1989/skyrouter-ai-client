'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';
import { parseApiError, logError, getErrorRecoveryActions, ERROR_MESSAGES } from '@/utils/errorUtils';

// 定义 Context 类型
interface ErrorContextType {
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
  notifyWarning: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
  handleApiError: (error: any, fallbackMessage?: string) => void;
  handleNetworkError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  // 从 useNotification 获取方法（可能是 showXxx 而不是 notifyXxx）
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotification();

  // 包装成 notifyXxx，保持外部调用一致性
  const notifySuccess = (title: string, message?: string) => {
    showSuccess(title, message);
  };

  const notifyError = (title: string, message?: string) => {
    showError(title, message);
  };

  const notifyWarning = (title: string, message?: string) => {
    showWarning(title, message);
  };

  const notifyInfo = (title: string, message?: string) => {
    showInfo(title, message);
  };

  const handleApiError = (error: any, fallbackMessage?: string) => {
    const appError = parseApiError(error);
    logError(appError, 'API调用');

    const errorInfo = ERROR_MESSAGES[appError.type];
    const actions = getErrorRecoveryActions(appError);

    // 将 actions 合并到 message 中（因为 showError 不支持第三个参数）
    let message = appError.message || errorInfo.description;
    if (actions && actions.length > 0) {
      message += `\n可用操作：${actions.map(a => a.label).join('、')}`;
    }

    notifyError(errorInfo.title, message);
  };

  const handleNetworkError = (error: any) => {
    const appError = parseApiError(error);
    logError(appError, '网络请求');

    const errorInfo = ERROR_MESSAGES[appError.type];
    const actions = getErrorRecoveryActions(appError);

    let message = appError.message || errorInfo.description;
    if (actions && actions.length > 0) {
      message += `\n可用操作：${actions.map(a => a.label).join('、')}`;
    }

    notifyError(errorInfo.title, message);
  };

  const value: ErrorContextType = {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    handleApiError,
    handleNetworkError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {/* 注意：NotificationContainer 内部已经使用 useNotification，不需要传 props */}
      <NotificationContainer />
    </ErrorContext.Provider>
  );
}