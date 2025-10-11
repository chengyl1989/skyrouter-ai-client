'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, Image, Video, FileText, Brain } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface SearchResult {
  id: string;
  type: 'conversation' | 'search' | 'image' | 'video';
  title: string;
  content: string;
  timestamp: Date;
  tabToOpen: string;
  itemId?: string;
  modelUsed?: string;
  query?: string;
  results?: any[]; // 假设是数组
}

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { conversations, searchResults, setCurrentTab, setCurrentConversation } = useStore();

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];

    // 搜索对话
    conversations.forEach(conv => {
      if (conv.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        searchResults.push({
          id: conv.id,
          type: 'conversation',
          title: conv.title,
          content: `对话 • ${conv.messages.length} 条消息`,
          timestamp: conv.createdAt,
          tabToOpen: 'chat',
          itemId: conv.id
        });
      }
    });
    // 搜索记录
const newSearchEntries: SearchResult[] = []; // 用新数组避免循环中修改原数组
searchResults.forEach(result => {
  if (result.query && result.query.toLowerCase().includes(searchQuery.toLowerCase())) {
    newSearchEntries.push({
      id: `search-${result.id}`,
      type: 'search',
      title: result.query,
      content: `搜索 • ${result.results?.length || 0} 个结果`,
      timestamp: result.timestamp,
      tabToOpen: 'search'
    });
  }
});
searchResults.push(...newSearchEntries);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [conversations, searchResults]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && results.length > 0) {
        handleResultClick(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    setCurrentTab(result.tabToOpen as any);
    if (result.itemId) {
      setCurrentConversation(result.itemId);
    }
    onClose();
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'conversation':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'search':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'image':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'video':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'conversation':
        return <MessageCircle className="w-4 h-4" />;
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索对话、记录..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          autoFocus
        />
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="mt-4 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.title}
                    </h4>
                    {result.modelUsed && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {result.modelUsed}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                    {result.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {result.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 无结果提示 */}
      {query && results.length === 0 && (
        <div className="mt-4 text-center py-8">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">没有找到相关结果</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            尝试使用不同的关键词
          </p>
        </div>
      )}

      {/* 初始状态提示 */}
      {!query && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            快速访问：
          </div>
          <button
            onClick={() => {
              setCurrentTab('chat');
              onClose();
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">开始新的对话</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('search');
              onClose();
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 dark:text-gray-300">智能搜索</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('image');
              onClose();
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Image className="w-4 h-4 text-purple-500" />
            <span className="text-gray-700 dark:text-gray-300">图片生成</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('video');
              onClose();
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-orange-500" />
            <span className="text-gray-700 dark:text-gray-300">视频生成</span>
          </button>
        </div>
      )}
    </div>
  );
}