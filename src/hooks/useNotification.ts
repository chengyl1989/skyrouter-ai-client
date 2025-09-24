'use client';

import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Date.now().toString();
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 5000,
      };
      setNotifications(prev => [...prev, newNotification]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: 'success', title, message });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: 'error', title, message });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: 'warning', title, message });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: 'info', title, message });
    },
    [addNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };
}