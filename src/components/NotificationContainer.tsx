'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          getIcon={getIcon}
          getBackgroundColor={getBackgroundColor}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
  getIcon: (type: NotificationType) => React.ReactNode;
  getBackgroundColor: (type: NotificationType) => string;
}

function NotificationItem({
  notification,
  onClose,
  getIcon,
  getBackgroundColor,
}: NotificationItemProps) {
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  return (
    <div
      className={`max-w-sm w-full shadow-lg rounded-lg border-l-4 p-4 animate-slide-in ${getBackgroundColor(notification.type)}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}