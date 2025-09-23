'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, X, MessageCircle, Image, Video, Search as SearchIcon, Clock, Hash } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'conversation' | 'search' | 'image' | 'video';
  title: string;
  content: string;
  timestamp: Date;
  modelUsed?: string;
  tabToOpen: 'chat' | 'search' | 'image' | 'video';
  itemId?: string;
}

interface GlobalSearchProps {
  onSelectResult?: (result: SearchResult) => void;
  onClose?: () => void;
}

export function GlobalSearch({ onSelectResult, onClose }: GlobalSearchProps) {
  const { conversations, searchResults, generatedImages, generatedVideos, setCurrentTab, setCurrentConversation } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 搜索函数
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query_lower = searchQuery.toLowerCase();
    const searchResults_array: SearchResult[] = [];

    // 搜索对话记录
    conversations.forEach(conv => {
      // 搜索对话标题
      if (conv.title.toLowerCase().includes(query_lower)) {
        searchResults_array.push({
          id: `conv-title-${conv.id}`,
          type: 'conversation',
          title: conv.title,
          content: `对话 • ${conv.messages.length} 条消息`,
          timestamp: new Date(conv.updatedAt || conv.createdAt),
          tabToOpen: 'chat',
          itemId: conv.id,
        });
      }

      // 搜索对话内容
      conv.messages.forEach((msg, msgIndex) => {
        if (msg.content.toLowerCase().includes(query_lower)) {
          const contentPreview = msg.content.length > 100
            ? msg.content.substring(0, 100) + '...'
            : msg.content;

          searchResults_array.push({
            id: `conv-msg-${conv.id}-${msgIndex}`,
            type: 'conversation',
            title: conv.title || `对话 ${conv.id.slice(0, 8)}`,
            content: contentPreview,
            timestamp: new Date(conv.updatedAt || conv.createdAt),
            modelUsed: msg.role === 'assistant' ? '模型回复' : '用户消息',
            tabToOpen: 'chat',
            itemId: conv.id,
          });
        }
      });
    });

    // 搜索搜索记录
    searchResults.forEach(result => {
      if (result.query.toLowerCase().includes(query_lower) ||
          result.content.toLowerCase().includes(query_lower)) {
        searchResults_array.push({
          id: `search-${result.id}`,
          type: 'search',
          title: result.query,
          content: result.content.length > 100
            ? result.content.substring(0, 100) + '...'
            : result.content,
          timestamp: result.timestamp,
          modelUsed: result.model,
          tabToOpen: 'search',
          itemId: result.id,
        });
      }
    });

    // 搜索生成的图片
    generatedImages.forEach(img => {
      if (img.prompt.toLowerCase().includes(query_lower)) {
        searchResults_array.push({
          id: `image-${img.id}`,
          type: 'image',
          title: img.prompt,
          content: `图片生成 • ${img.model}`,
          timestamp: img.createdAt,
          modelUsed: img.model,
          tabToOpen: 'image',
          itemId: img.id,
        });
      }
    });

    // 搜索生成的视频
    generatedVideos.forEach(video => {
      if (video.prompt.toLowerCase().includes(query_lower)) {
        searchResults_array.push({
          id: `video-${video.id}`,
          type: 'video',
          title: video.prompt,
          content: `视频生成 • ${video.model}`,
          timestamp: video.createdAt,
          modelUsed: video.model,
          tabToOpen: 'video',
          itemId: video.id,
        });
      }
    });

    // 按时间排序
    const sortedResults = searchResults_array.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setResults(sortedResults.slice(0, 20)); // 限制结果数量
    setSelectedIndex(0);
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
    }
  };

  // 处理选择结果
  const handleSelectResult = (result: SearchResult) => {
    // 切换到对应标签页
    setCurrentTab(result.tabToOpen);

    // 如果是对话结果，设置当前对话
    if (result.type === 'conversation' && result.itemId) {
      setCurrentConversation(result.itemId);
    }

    // 通知父组件
    onSelectResult?.(result);
    onClose?.();
  };

  // 获取类型图标
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'conversation':
        return <MessageCircle className="w-4 h-4" />;
      case 'search':
        return <SearchIcon className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  // 获取类型标签颜色
  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'conversation':
        return 'bg-blue-100 text-blue-700';
      case 'search':
        return 'bg-green-100 text-green-700';
      case 'image':
        return 'bg-purple-100 text-purple-700';
      case 'video':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 搜索监听
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300); // 防抖

    return () => clearTimeout(timer);
  }, [query, conversations, searchResults, generatedImages, generatedVideos]);

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索对话、搜索记录、生成内容..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors duration-200"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-slide-in">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelectResult(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${index === selectedIndex ? 'bg-primary-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {result.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(result.timestamp)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {result.content}
                  </p>
                  {result.modelUsed && (
                    <p className="text-xs text-gray-500 mt-1">
                      {result.modelUsed}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {query && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-6 text-center animate-fade-in">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            没有找到与 "{query}" 相关的记录
          </p>
        </div>
      )}
    </div>
  );
}