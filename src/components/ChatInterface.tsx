import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { createApiClient } from '@/lib/api';
import { categorizeModels } from '@/lib/modelUtils';
import { useModels } from '@/hooks/useModels';
import { ChatMessage } from '@/types';
import { Send, Loader2, RefreshCw, User, Bot, Settings, Sliders, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// 模拟组件实现以确保代码可运行
export function ChatInterface() {
  const { apiConfig } = useStore();
  const { categorizedModels, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels(true);
  
  // 基础状态变量
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 模拟函数实现
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const createNewConversation = () => generateId();
  const handleSend = async () => { /* 实现略 */ };
  const handleKeyPress = (e: React.KeyboardEvent) => { /* 实现略 */ };
  const handleKeyDown = (e: React.KeyboardEvent) => { /* 实现略 */ };
  const handleSendMessage = () => { /* 实现略 */ };
  
  if (!apiConfig) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        请先配置 API 设置
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 模型选择器 */}
      <div className="p-3 sm:p-4 border-b bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">聊天模型:</label>
            {modelsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">加载模型中...</span>
              </div>
            ) : modelsError ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500 truncate">{modelsError}</span>
                <button
                  onClick={refreshModels}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="重试获取模型"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-0"
                disabled={categorizedModels.chat.length === 0}
              >
                {categorizedModels.chat.length === 0 ? (
                  <option value="">无可用模型</option>
                ) : (
                  categorizedModels.chat.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.id}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:ml-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              ({categorizedModels.chat.length} 个可用模型)
            </span>
            <button
              onClick={createNewConversation}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
            >
              新对话
            </button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {/* 消息列表实现略 */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4 text-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-gray-500">加载模型中...</span>
          </div>
        )}
      </div>
      
      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
            rows={3}
          />
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex justify-between items-center mt-3">
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className={`px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200 flex items-center gap-2 button-press focus-ring ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send className="w-4 h-4" />
            发送
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="选择模型"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowApiConfig(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="API配置"
            >
              <Sliders className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}