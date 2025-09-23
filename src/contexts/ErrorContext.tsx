'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';
import { parseApiError, logError, getErrorRecoveryActions, ERROR_MESSAGES } from '@/utils/errorUtils';

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
  const {
    notifications,
    removeNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  } = useNotification();

  const handleApiError = (error: any, fallbackMessage?: string) => {
    const appError = parseApiError(error);
    logError(appError, 'API调用');

    const errorInfo = ERROR_MESSAGES[appError.type];
    const actions = getErrorRecoveryActions(appError);

    notifyError(
      errorInfo.title,
      appError.message || errorInfo.description,
      {
        actions: actions,
        duration: appError.type === 'RATE_LIMIT_ERROR' ? 10000 : 7000,
      }
    );
  };

  const handleNetworkError = (error: any) => {
    const appError = parseApiError(error);
    logError(appError, '网络请求');

    const errorInfo = ERROR_MESSAGES[appError.type];
    const actions = getErrorRecoveryActions(appError);

    notifyError(
      errorInfo.title,
      appError.message || errorInfo.description,
      {
        actions: actions,
        duration: 8000,
      }
    );
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
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </ErrorContext.Provider>
  );
}