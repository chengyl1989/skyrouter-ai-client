'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    {
      value: 'light' as const,
      label: '浅色主题',
      icon: Sun,
      description: '明亮清爽的界面',
      color: 'from-yellow-400 to-orange-400'
    },
    {
      value: 'dark' as const,
      label: '深色主题',
      icon: Moon,
      description: '护眼深色模式',
      color: 'from-purple-600 to-blue-600'
    },
    {
      value: 'system' as const,
      label: '跟随系统',
      icon: Monitor,
      description: '自动适应系统',
      color: 'from-gray-600 to-gray-700'
    },
  ];

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md backdrop-blur-sm"
        title="切换主题"
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

        {currentTheme && (
          <currentTheme.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        )}

        {/* 闪烁效果 */}
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 animate-pulse" />
      </button>

      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-3 z-20 min-w-[200px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl py-2 animate-slide-in overflow-hidden">
            {/* 菜单标题 */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">主题设置</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">选择您喜欢的界面风格</p>
            </div>

            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group ${
                    isSelected
                      ? 'bg-gradient-to-r ' + themeOption.color + '/10 text-gray-900 dark:text-gray-100 border-l-4 border-purple-500'
                      : 'text-gray-700 dark:text-gray-300 hover:translate-x-1'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${themeOption.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{themeOption.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{themeOption.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
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