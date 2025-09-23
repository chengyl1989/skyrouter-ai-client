'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ChatInterface } from '@/components/ChatInterface';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoGenerator } from '@/components/VideoGenerator';
import { SearchInterface } from '@/components/SearchInterface';
import { ApiConfigModal } from '@/components/ApiConfig';
import { MessageCircle, Image, Video, Search, Settings, Trash2, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { useKeyboardShortcuts, defaultShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
  const {
    apiConfig,
    currentTab,
    setCurrentTab,
    conversations,
    currentConversation,
    setCurrentConversation,
    deleteConversation,
    clearConversations,
    searchResults,
    clearSearchResults,
  } = useStore();

  const [showApiConfig, setShowApiConfig] = useState(!apiConfig);
  const [selectedSearchResult, setSelectedSearchResult] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // 当有新的搜索结果时，自动选择最新的结果
  useEffect(() => {
    if (searchResults.length > 0) {
      // 总是选择最新的搜索结果（数组第一个元素）
      setSelectedSearchResult(searchResults[0]);
    }
  }, [searchResults]);

  // 设置键盘快捷键
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: () => setShowGlobalSearch(true),
      description: '打开全局搜索'
    }
  ]);

  // 监听API配置打开事件
  useEffect(() => {
    const handleOpenApiConfig = () => {
      setShowApiConfig(true);
    };

    window.addEventListener('openApiConfig', handleOpenApiConfig);
    return () => {
      window.removeEventListener('openApiConfig', handleOpenApiConfig);
    };
  }, []);

  const currentConv = conversations.find(conv => conv.id === currentConversation);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-bg md:flex-row transition-colors duration-300 page-enter">
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white dark:bg-dark-card border-b dark:border-dark-border px-4 py-3 flex items-center justify-between slide-up">
        <h1 className="text-lg font-bold text-gray-900 dark:text-dark-text">小宿AI助手</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowApiConfig(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 button-press focus-ring"
            title="API设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 button-press focus-ring"
          >
            {showSidebar ? <X className="w-4 h-4 text-gray-600 dark:text-dark-text" /> : <Menu className="w-4 h-4 text-gray-600 dark:text-dark-text" />}
          </button>
        </div>
      </div>

      {/* 移动端标签页导航 */}
      <div className="md:hidden bg-white dark:bg-dark-card border-b dark:border-dark-border slide-up">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => { setCurrentTab('chat'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-1 py-3 px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap border-b-2 button-press ${
              currentTab === 'chat'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 animate-bounce-subtle'
                : 'border-transparent text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            聊天
          </button>
          <button
            onClick={() => { setCurrentTab('search'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              currentTab === 'search'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-transparent text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
            }`}
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
          <button
            onClick={() => { setCurrentTab('image'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              currentTab === 'image'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-transparent text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
            }`}
          >
            <Image className="w-4 h-4" />
            生图
          </button>
          <button
            onClick={() => { setCurrentTab('video'); setShowSidebar(false); }}
                          className={`flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-medium transition-colors rounded-lg ${
                currentTab === 'video'
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
              }`}
          >
            <Video className="w-4 h-4" />
            视频
          </button>
        </div>
      </div>
      {/* 侧边栏 */}
      <div className={`${
        showSidebar ? 'fixed inset-0 z-50 bg-black bg-opacity-50 md:relative md:bg-transparent' : 'hidden'
      } md:block md:w-80 md:relative`}>
        <div className={`${
          showSidebar ? 'w-80 h-full bg-white dark:bg-dark-card shadow-xl' : 'w-full h-full bg-white dark:bg-dark-card'
        } md:w-80 md:bg-white md:dark:bg-dark-card md:border-r md:dark:border-dark-border flex flex-col transition-colors duration-300`}>
          {/* 桌面端头部 */}
          <div className="hidden md:block p-4 border-b dark:border-dark-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">小宿AI助手</h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  title="API设置"
                >
                  <Settings className="w-4 h-4 text-gray-600 dark:text-dark-text" />
                </button>
              </div>
            </div>

            {/* 桌面端标签页切换 */}
            <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setCurrentTab('chat')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                  currentTab === 'chat'
                    ? 'bg-white dark:bg-dark-bg text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
                }`}
              >
                <MessageCircle className="w-3 h-3" />
                聊天
              </button>
              <button
                onClick={() => setCurrentTab('search')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                  currentTab === 'search'
                    ? 'bg-white dark:bg-dark-bg text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
                }`}
              >
                <Search className="w-3 h-3" />
                搜索
              </button>
              <button
                onClick={() => setCurrentTab('image')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                  currentTab === 'image'
                    ? 'bg-white dark:bg-dark-bg text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
                }`}
              >
                <Image className="w-3 h-3" />
                生图
              </button>
              <button
                onClick={() => setCurrentTab('video')}
                className={`flex items-center justify-center gap-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                  currentTab === 'video'
                    ? 'bg-white dark:bg-dark-bg text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
                }`}
              >
                <Video className="w-3 h-3" />
                视频
              </button>
            </div>
          </div>

          {/* 移动端侧边栏头部 */}
          <div className="md:hidden p-4 border-b dark:border-dark-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">历史记录</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-dark-text" />
            </button>
          </div>

          {/* 侧边栏内容 */}
          <div className="flex-1 overflow-hidden">
            {currentTab === 'chat' && (
              <div className="h-full flex flex-col">
                {/* 对话列表头部 */}
                <div className="p-4 border-b dark:border-dark-border flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text">对话历史</h3>
                  {conversations.length > 0 && (
                    <button
                      onClick={clearConversations}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500 dark:text-red-400 transition-colors duration-200"
                      title="清空所有对话"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* 对话列表 */}
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      还没有对话记录
                    </div>
                  ) : (
                    <div className="p-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setCurrentConversation(conv.id);
                            setShowSidebar(false);
                          }}
                          className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group ${
                            currentConversation === conv.id
                              ? 'bg-blue-50 border-blue-200 border'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {conv.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {conv.messages.length} 条消息
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(conv.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {currentTab === 'search' && (
              <div className="h-full flex flex-col">
                {/* 搜索历史头部 */}
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-medium">搜索历史</h3>
                  {searchResults.length > 0 && (
                    <button
                      onClick={clearSearchResults}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                      title="清空搜索历史"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* 搜索历史列表 */}
                <div className="flex-1 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>还没有搜索记录</p>
                      <p className="text-xs mt-1">开始搜索来查看历史记录</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => {
                            setSelectedSearchResult(result);
                            setShowSidebar(false);
                          }}
                          className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors border ${
                            selectedSearchResult?.id === result.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              result.model === 'SmartSearch'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {result.model === 'SmartSearch' ? '🧠' : '📄'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                {result.query}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{result.timestamp.toLocaleDateString()}</span>
                                {result.results && result.results.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{result.results.length} 个结果</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {currentTab === 'image' && (
              <div className="p-4">
                <h3 className="font-medium mb-2">图片生成</h3>
                <p className="text-sm text-gray-500">
                  使用右侧面板生成图片
                </p>
              </div>
            )}
            
            {currentTab === 'video' && (
              <div className="p-4">
                <h3 className="font-medium mb-2">视频生成</h3>
                <p className="text-sm text-gray-500">
                  使用右侧面板生成视频
                </p>
              </div>
            )}
          </div>

          {/* 底部状态 */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              {apiConfig ? (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>已连接</span>
                  </div>
                  <div className="truncate">{apiConfig.endpoint}</div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>未配置 API</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentTab === 'chat' && <ChatInterface />}
        {currentTab === 'image' && <ImageGenerator />}
        {currentTab === 'video' && <VideoGenerator />}
        {currentTab === 'search' && <SearchInterface selectedSearchResult={selectedSearchResult} />}
      </div>

      {/* API 配置模态框 */}
      <ApiConfigModal
        isOpen={showApiConfig}
        onClose={() => setShowApiConfig(false)}
      />

      {/* 全局搜索模态框 */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </div>
  );
}