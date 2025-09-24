'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { useError } from '@/contexts/ErrorContext';
import { Search, Loader2, RefreshCw, ExternalLink, Clock, Globe, Settings, X, Filter, ChevronDown, ChevronUp, Brain, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface SearchResult {
  id: string;
  query: string;
  content: string;
  model: string;
  timestamp: Date;
  results?: any[];
  searchParams?: SearchParameters;
}

interface SearchParameters {
  count?: string;
  freshness?: string;
  offset?: string;
  mkt?: string;
  cc?: string;
  safeSearch?: string;
  setLang?: string;
}

interface SearchInterfaceProps {
  selectedSearchResult?: SearchResult | null;
}

export function SearchInterface({ selectedSearchResult }: SearchInterfaceProps) {
  const { apiConfig, addSearchResult, setApiConfig } = useStore();
  const { categorizedModels, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels(true);
  const { handleApiError, notifySuccess } = useError();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<SearchParameters>({
    count: '10',
    freshness: '',
    offset: '0',
    mkt: 'zh-CN',
    cc: 'CN',
    safeSearch: 'Moderate',
    setLang: 'zh-CN'
  });

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // 判断搜索模型是否可用
  const isModelAvailable = (modelId: string) => {
    const id = modelId.toLowerCase();
    return (
      id === 'smartsearch' ||
      id === 'fulltextsearch' ||
      id === 'search'
    );
  };

  // 设置默认模型（优先选择可用模型）
  useEffect(() => {
    if (categorizedModels.other.length > 0 && !selectedModel) {
      // 优先选择可用的模型
      const availableModel = categorizedModels.other.find(model => isModelAvailable(model.id));
      if (availableModel) {
        setSelectedModel(availableModel.id);
      } else {
        // 如果没有可用模型，选择第一个模型
        setSelectedModel(categorizedModels.other[0].id);
      }
    }
  }, [categorizedModels.other, selectedModel]);

  // 检查是否需要配置搜索端点
  const needsSearchConfig = () => {
    return !apiConfig?.searchEndpointId;
  };

  const handleSearch = async () => {
    if (!query.trim() || !apiConfig) return;

    // 验证模型可用性
    if (!isModelAvailable(selectedModel)) {
      alert('所选搜索模型暂不可用，请选择其他可用模型');
      return;
    }

    // 检查是否需要配置搜索端点
    if (needsSearchConfig()) {
      setShowConfigHelp(true);
      return;
    }

    setIsSearching(true);

    try {
      // 使用智能搜索或全文搜索
      console.log('Using search model:', selectedModel);

      // 构建搜索请求参数
      const searchRequest: any = {
        query,
        model: selectedModel,
        searchParams: {
          count: searchParams.count || '10',
          offset: searchParams.offset || '0'
        }
      };

      // 添加可选参数到searchParams对象中
      if (searchParams.freshness) {
        searchRequest.searchParams.freshness = searchParams.freshness;
      }
      if (searchParams.mkt) {
        searchRequest.searchParams.mkt = searchParams.mkt;
      }
      if (searchParams.cc) {
        searchRequest.searchParams.cc = searchParams.cc;
      }
      if (searchParams.safeSearch) {
        searchRequest.searchParams.safeSearch = searchParams.safeSearch;
      }
      if (searchParams.setLang) {
        searchRequest.searchParams.setLang = searchParams.setLang;
      }

      console.log('Sending search request:', searchRequest);

      // 使用统一的API配置
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'X-API-Endpoint': apiConfig.endpoint,
          'X-Search-Endpoint-Id': apiConfig.searchEndpointId || ''
        },
        body: JSON.stringify(searchRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `搜索请求失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search response:', data);

      if (data.success !== false && data.content) {
        const searchResult: SearchResult = {
          id: generateId(),
          query,
          content: data.content || `搜索结果: ${query}`,
          model: selectedModel,
          timestamp: new Date(),
          results: data.results || [],
          searchParams: { ...searchParams }
        };

        addSearchResult(searchResult);
        notifySuccess('搜索完成');
      } else {
        throw new Error(data.error || '搜索响应格式错误');
      }
    } catch (error) {
      console.error('Search error:', error);
      handleApiError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const updateSearchParams = (key: keyof SearchParameters, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* 搜索模型选择器 - 保持原有功能但更新配色 */}
      <div className="relative z-10 p-4 border-b dark:border-gray-600 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm shadow-lg">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-max flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              搜索模型:
            </label>
            {modelsLoading ? (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">加载模型中...</span>
              </div>
            ) : modelsError ? (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-red-700 dark:text-red-300 truncate">{modelsError}</span>
                <button onClick={refreshModels} className="p-1 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors" title="重试获取模型">
                  <RefreshCw className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                {/* 搜索类型选择按钮 */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 flex-1">
                  <motion.button
                    onClick={() => setSelectedModel('SmartSearch')}
                    disabled={isSearching}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedModel === 'SmartSearch'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Brain className="w-4 h-4 inline mr-2" />
                    智能搜索
                  </motion.button>
                  <motion.button
                    onClick={() => setSelectedModel('FullTextSearch')}
                    disabled={isSearching}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedModel === 'FullTextSearch'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    全文搜索
                  </motion.button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium ${
                    apiConfig?.searchEndpointId
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                  }`}>
                    {apiConfig?.searchEndpointId ? '✓ 端点已配置' : '⚠ 需配置端点'}
                  </span>

                  {!apiConfig?.searchEndpointId && (
                    <motion.button
                      onClick={() => setShowConfigHelp(true)}
                      className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                      title="配置搜索端点"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Settings className="w-3 h-3 inline mr-1" />
                      点击配置
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 搜索输入框 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入搜索关键词..."
              className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[56px] max-h-32 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 modern-input shadow-sm"
              rows={2}
              disabled={isSearching}
              whileFocus={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <motion.button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching || !isModelAvailable(selectedModel) || !apiConfig?.searchEndpointId}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 min-h-[56px] whitespace-nowrap shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline font-medium">搜索中...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">开始搜索</span>
                </>
              )}
            </motion.button>
          </div>

          {/* 快速参数设置 */}
          <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50">
            <div className="flex flex-wrap items-center gap-3">
              {/* 结果数量 */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">数量:</label>
                <select
                  value={searchParams.count || '10'}
                  onChange={(e) => updateSearchParams('count', e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              {/* 安全等级 */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">安全:</label>
                <select
                  value={searchParams.safeSearch || 'Moderate'}
                  onChange={(e) => updateSearchParams('safeSearch', e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                >
                  <option value="Strict">严格</option>
                  <option value="Moderate">中等</option>
                  <option value="Off">关闭</option>
                </select>
              </div>

              {/* 新鲜度 */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">时间:</label>
                <select
                  value={searchParams.freshness || ''}
                  onChange={(e) => updateSearchParams('freshness', e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                >
                  <option value="">全部</option>
                  <option value="Day">一天</option>
                  <option value="Week">一周</option>
                  <option value="Month">一月</option>
                </select>
              </div>

              {/* 语言设置 */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">语言:</label>
                <select
                  value={searchParams.setLang || 'zh-CN'}
                  onChange={(e) => updateSearchParams('setLang', e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSearching}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en">英文</option>
                  <option value="ja">日文</option>
                  <option value="ko">韩文</option>
                </select>
              </div>

              {/* 高级参数按钮 */}
              <motion.button
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                className="ml-auto px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-xs flex items-center gap-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter className="w-3 h-3" />
                高级参数
                {showAdvancedParams ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </motion.button>
            </div>

            {/* 高级参数展开 */}
            {showAdvancedParams && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">市场地区</label>
                  <select
                    value={searchParams.mkt || 'zh-CN'}
                    onChange={(e) => updateSearchParams('mkt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSearching}
                  >
                    <option value="zh-CN">中文(中国)</option>
                    <option value="en-US">英文(美国)</option>
                    <option value="ja-JP">日文(日本)</option>
                    <option value="ko-KR">韩文(韩国)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">国家地区</label>
                  <select
                    value={searchParams.cc || 'CN'}
                    onChange={(e) => updateSearchParams('cc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSearching}
                  >
                    <option value="CN">中国</option>
                    <option value="US">美国</option>
                    <option value="JP">日本</option>
                    <option value="KR">韩国</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 搜索结果展示区域 */}
      <div className="flex-1 overflow-y-auto">
        {selectedSearchResult ? (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedSearchResult.query}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSearchResult.model} • {selectedSearchResult.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 搜索统计信息 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  {selectedSearchResult.results?.length || 0} 个结果
                </span>

                {selectedSearchResult.searchParams && (
                  <>
                    {selectedSearchResult.searchParams.freshness && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {selectedSearchResult.searchParams.freshness === 'Day' ? '一天内' :
                         selectedSearchResult.searchParams.freshness === 'Week' ? '一周内' :
                         selectedSearchResult.searchParams.freshness === 'Month' ? '一月内' : '全部时间'}
                      </span>
                    )}
                    {selectedSearchResult.searchParams.safeSearch && selectedSearchResult.searchParams.safeSearch !== 'Moderate' && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {selectedSearchResult.searchParams.safeSearch === 'Strict' ? '严格安全' : '安全关闭'}
                      </span>
                    )}
                    {selectedSearchResult.searchParams.count && selectedSearchResult.searchParams.count !== '10' && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {selectedSearchResult.searchParams.count} 条
                      </span>
                    )}
                  </>
                )}

                {/* 搜索类型标识 */}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selectedSearchResult.model === 'SmartSearch'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {selectedSearchResult.model === 'SmartSearch' ? '智能搜索' : '全文搜索'}
                </span>
              </div>
            </div>

            {/* 内容摘要 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                {selectedSearchResult.content}
              </ReactMarkdown>
            </div>

            {/* 搜索结果列表 - 百度风格 */}
            {selectedSearchResult.results && selectedSearchResult.results.length > 0 && (
              <div className="space-y-6">
                {selectedSearchResult.results.map((result, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
                    <div className="p-4">
                      {/* 标题和链接 */}
                      <a
                        href={result.url || result.displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block mb-2"
                      >
                        <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                          {result.name || result.title || '无标题'}
                        </h3>
                      </a>

                      {/* 显示URL */}
                      <div className="text-sm text-green-600 dark:text-green-400 mb-2 font-mono">
                        {result.displayUrl || result.url || '无链接'}
                      </div>

                      {/* 内容描述 */}
                      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                        {selectedSearchResult.model === 'FullTextSearch' ? (
                          // 全文搜索显示更多内容
                          <div>
                            <p className="mb-2">{result.snippet || result.description || '无描述'}</p>
                            {result.fullContent && (
                              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">完整内容：</p>
                                <p className="text-sm">{result.fullContent}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          // 智能搜索显示摘要
                          <p>{result.snippet || result.description || '无描述'}</p>
                        )}
                      </div>

                      {/* 底部信息 */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          {result.dateLastCrawled && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(result.dateLastCrawled).toLocaleDateString()}
                            </span>
                          )}
                          {result.siteName && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {result.siteName}
                            </span>
                          )}
                        </div>

                        {/* 相关性评分 */}
                        {result.relevanceScore && (
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500">
                              {'★'.repeat(Math.min(5, Math.floor(result.relevanceScore / 20)))}
                            </span>
                            <span className="text-gray-400">
                              {'☆'.repeat(5 - Math.min(5, Math.floor(result.relevanceScore / 20)))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">开始搜索</p>
              <p className="text-sm">输入关键词并选择搜索模型来获取结果</p>
            </div>
          </div>
        )}
      </div>

      {/* 配置帮助弹窗 */}
      {showConfigHelp && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                需要配置搜索端点
              </h3>
              <motion.button
                onClick={() => setShowConfigHelp(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      搜索功能需要配置搜索端点ID
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 leading-relaxed">
                      为了使用搜索功能，需要先在统一配置管理中设置搜索端点ID。
                    </p>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">配置步骤：</p>
                      <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                        <li>点击左上角的设置按钮</li>
                        <li>在搜索端点配置中填入端点ID</li>
                        <li>保存配置</li>
                        <li>返回搜索页面即可使用</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowConfigHelp(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  稍后配置
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowConfigHelp(false);
                    // 这里可以打开配置弹窗
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm shadow-lg shadow-blue-500/25"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  立即配置
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}