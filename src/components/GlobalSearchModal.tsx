'use client';

import { useEffect } from 'react';
import { GlobalSearch } from './GlobalSearch';
import { X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 搜索内容 */}
      <div className="relative w-full max-w-2xl animate-slide-up">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
              全局搜索
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 搜索区域 */}
          <div className="p-4">
            <GlobalSearch onClose={onClose} />
          </div>

          {/* 快捷键提示 */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                    ↑↓
                  </kbd>
                  <span>导航</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                    Enter
                  </kbd>
                  <span>打开</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                    Esc
                  </kbd>
                  <span>关闭</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span>快捷键:</span>
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}