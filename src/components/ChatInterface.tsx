'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { createApiClient } from '@/lib/api';
import { ChatMessage } from '@/types';
import { Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function ChatInterface() {
  const {
    apiConfig,
    conversations,
    currentConversation,
    addConversation,
    addMessage,
    updateMessage,
    setCurrentConversation,
  } = useStore();

  const { categorizedModels, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels(true);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find(conv => conv.id === currentConversation);

  // 设置默认模型
  useEffect(() => {
    if (categorizedModels.chat.length > 0 && !selectedModel) {
      setSelectedModel(categorizedModels.chat[0].id);
    }
  }, [categorizedModels.chat, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const createNewConversation = () => {
    const id = generateId();
    const newConversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      model: selectedModel,
    };
    addConversation(newConversation);
    return id;
  };

  const handleSend = async () => {
    if (!input.trim() || !apiConfig) return;

    const conversationId = currentConversation || createNewConversation();
    
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    addMessage(conversationId, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const client = createApiClient(apiConfig);
      const conv = conversations.find(c => c.id === conversationId);
      const messages = conv ? [...conv.messages, userMessage] : [userMessage];

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      addMessage(conversationId, assistantMessage);

      // 使用流式响应
      const stream = await client.streamChatCompletion({
        model: selectedModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                accumulatedContent += content;
                updateMessage(conversationId, assistantMessage.id, accumulatedContent);
              }
            } catch (error) {
              console.error('Parse streaming response error:', error);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      addMessage(conversationId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
                className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-0"
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
        {currentConv?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                {message.role === 'user' ? (
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                ) : (
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                )}
              </div>
              <div
                className={`p-3 sm:p-4 rounded-lg shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm max-w-none text-sm sm:text-base">
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-3 sm:p-4 border-t bg-white shadow-sm">
        <div className="flex gap-2 sm:gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px] max-h-32"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 min-w-[44px] sm:min-w-[48px] flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}