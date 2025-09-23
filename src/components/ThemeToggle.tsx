'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ];

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors duration-200"
        title="切换主题"
      >
        {currentTheme && (
          <currentTheme.icon className="w-5 h-5 text-gray-600 dark:text-dark-text" />
        )}
      </button>

      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 z-20 min-w-[140px] bg-white dark:bg-dark-card border dark:border-dark-border rounded-lg shadow-lg py-1 animate-slide-in">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                    theme === themeOption.value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-dark-text'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}