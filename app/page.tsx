'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ChatInterface } from '@/components/ChatInterface';
import { ImageGenerator } from '@/components/ImageGenerator';
import { VideoGenerator } from '@/components/VideoGenerator';
import { SearchInterface } from '@/components/SearchInterface';
import { ApiConfigModal } from '@/components/ApiConfig';
import { MessageCircle, Image, Video, Search, Settings, Trash2, Menu, X, Brain, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { useKeyboardShortcuts, defaultShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  MouseFollower,
  ParticleBackground,
  LoadingSpinner,
  SuccessAnimation,
  ErrorAnimation,
  HoverCard,
  PulseButton,
  GlowText
} from '@/components/MicroInteractions';

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-gray-900 md:flex-row transition-all duration-500 page-enter relative overflow-hidden">
      {/* 微交互背景 */}
      <ParticleBackground />
      <MouseFollower />

      {/* 背景装饰元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-pink-300 dark:bg-pink-600 rounded-full opacity-10 blur-3xl animate-float"></div>

        {/* 额外的装饰粒子 */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.1
            }}
          />
        ))}
      </div>
      {/* 移动端顶部导航栏 */}
      <div className="md:hidden bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b dark:border-dark-border px-4 py-3 flex items-center justify-between slide-up shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">宿</span>
          </div>
          <GlowText className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            小宿AI助手
          </GlowText>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowApiConfig(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 button-press focus-ring shadow-sm hover:shadow-md"
            title="API设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 button-press focus-ring shadow-sm hover:shadow-md"
          >
            {showSidebar ? <X className="w-4 h-4 text-gray-600 dark:text-dark-text" /> : <Menu className="w-4 h-4 text-gray-600 dark:text-dark-text" />}
          </button>
        </div>
      </div>

      {/* 移动端标签页导航 */}
      <div className="md:hidden bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b dark:border-dark-border slide-up shadow-lg relative z-10">
        <div className="flex overflow-x-auto p-2">
          <button
            onClick={() => { setCurrentTab('chat'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap rounded-xl button-press flex-shrink-0 ${
              currentTab === 'chat'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            聊天
          </button>
          <button
            onClick={() => { setCurrentTab('search'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap rounded-xl button-press flex-shrink-0 ${
              currentTab === 'search'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Search className="w-4 h-4" />
            搜索
          </button>
          <button
            onClick={() => { setCurrentTab('image'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap rounded-xl button-press flex-shrink-0 ${
              currentTab === 'image'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Image className="w-4 h-4" />
            生图
          </button>
          <button
            onClick={() => { setCurrentTab('video'); setShowSidebar(false); }}
            className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300 whitespace-nowrap rounded-xl button-press flex-shrink-0 ${
              currentTab === 'video'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          showSidebar ? 'w-80 h-full bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl shadow-2xl border-r dark:border-dark-border' : 'w-full h-full bg-white dark:bg-dark-card'
        } md:w-80 md:bg-white/95 md:dark:bg-dark-card/95 md:backdrop-blur-xl md:border-r md:dark:border-dark-border flex flex-col transition-all duration-300`}>
          {/* 桌面端头部 */}
          <div className="hidden md:block p-6 border-b dark:border-dark-border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">宿</span>
                </div>
                <GlowText className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  小宿AI助手
                </GlowText>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  title="API设置"
                >
                  <Settings className="w-4 h-4 text-gray-600 dark:text-dark-text" />
                </button>
              </div>
            </div>

            {/* 桌面端标签页切换 */}
            <div className="grid grid-cols-2 gap-2 bg-white/50 dark:bg-gray-800/50 rounded-xl p-2 backdrop-blur-sm">
              <button
                onClick={() => setCurrentTab('chat')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentTab === 'chat'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                聊天
              </button>
              <button
                onClick={() => setCurrentTab('search')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentTab === 'search'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
              <button
                onClick={() => setCurrentTab('image')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentTab === 'image'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Image className="w-4 h-4" />
                生图
              </button>
              <button
                onClick={() => setCurrentTab('video')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentTab === 'video'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Video className="w-4 h-4" />
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
                          className={`p-4 mb-2 rounded-xl cursor-pointer transition-all duration-200 group backdrop-blur-sm ${
                            currentConversation === conv.id
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-700 shadow-lg shadow-purple-500/10'
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700'
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
                              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all duration-200 hover:scale-110"
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
                            <span className={`text-sm px-2 py-1 rounded-full flex items-center gap-1 ${
                              result.model === 'SmartSearch'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {result.model === 'SmartSearch' ? <><Brain className="w-3 h-3" />智能搜索</> : <><FileText className="w-3 h-3" />全文搜索</>}
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
          <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="text-xs">
              {apiConfig ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 dark:text-green-300 font-medium">已连接</span>
                  </div>
                  <div className="text-green-600 dark:text-green-400 truncate font-mono text-xs">{apiConfig.endpoint}</div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">未配置 API</span>
                  </div>
                  <div className="text-red-600 dark:text-red-400 text-xs mt-1">请先配置 API 设置</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* 主内容区域装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200 dark:bg-purple-700 rounded-full opacity-10 blur-2xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-200 dark:bg-blue-700 rounded-full opacity-10 blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {currentTab === 'chat' && <ChatInterface />}
          {currentTab === 'image' && <ImageGenerator />}
          {currentTab === 'video' && <VideoGenerator />}
          {currentTab === 'search' && <SearchInterface selectedSearchResult={selectedSearchResult} />}
        </div>
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