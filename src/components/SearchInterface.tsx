'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { Search, Loader2, RefreshCw, ExternalLink, Clock, Globe, Settings, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  // 获取搜索模型
  const searchModels = categorizedModels.other.filter(model => {
    const id = model.id.toLowerCase();
    return id === 'smartsearch' || id === 'fulltextsearch';
  });

  // 设置默认模型
  useEffect(() => {
    if (searchModels.length > 0 && !selectedModel) {
      const smartSearch = searchModels.find(model =>
        model.id.toLowerCase() === 'smartsearch'
      );
      setSelectedModel(smartSearch ? smartSearch.id : searchModels[0].id);
    }
  }, [searchModels, selectedModel]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const handleSearch = async () => {
    if (!query.trim() || !apiConfig || !selectedModel) return;

    // 检查搜索端点配置
    if (!apiConfig.searchEndpointId) {
      setShowConfigHelp(true);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'X-API-Endpoint': apiConfig.endpoint,
          'X-Search-Endpoint-Id': apiConfig.searchEndpointId,
        },
        body: JSON.stringify({
          query: query,
          model: selectedModel,
          searchParams: searchParams
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `搜索失败: ${response.status}`);
      }

      const data = await response.json();

      const searchResult: SearchResult = {
        id: generateId(),
        query,
        content: data.content || data.answer || '搜索完成，但未返回内容',
        model: selectedModel,
        timestamp: new Date(),
        results: data.results || data.sources || [],
        searchParams: searchParams
      };

      addSearchResult(searchResult);
      setQuery('');
    } catch (error) {
      console.error('Search error:', error);
      const errorResult: SearchResult = {
        id: generateId(),
        query,
        content: `搜索出错: ${error instanceof Error ? error.message : '未知错误'}`,
        model: selectedModel,
        timestamp: new Date(),
      };
      addSearchResult(errorResult);
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

  if (!apiConfig) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        请先配置 API 设置
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 搜索控制面板 */}
      <div className="p-3 sm:p-4 border-b bg-white shadow-sm">
        <div className="space-y-3 sm:space-y-4">
          {/* 模型选择 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 min-w-max">搜索模型:</label>
            {modelsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">加载模型中...</span>
              </div>
            ) : modelsError ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">{modelsError}</span>
                <button onClick={refreshModels} className="p-1 hover:bg-gray-100 rounded">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={isSearching}
                >
                  {searchModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.id === 'SmartSearch' ? '🧠 智能搜索' : 
                       model.id === 'FullTextSearch' ? '📄 全文搜索' : model.id}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    apiConfig?.searchEndpointId
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {apiConfig?.searchEndpointId ? '✓ 已配置' : '⚠ 需配置'}
                  </span>

                  {!apiConfig?.searchEndpointId && (
                    <button
                      onClick={() => setShowConfigHelp(true)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      title="配置搜索端点"
                    >
                      点击配置
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 搜索输入 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入搜索关键词或问题..."
              className="w-full sm:flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching || !selectedModel}
              className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  搜索中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  搜索
                </>
              )}
            </button>
          </div>

          {/* 高级搜索参数 */}
          <div className="border-t pt-3">
            <button
              onClick={() => setShowAdvancedParams(!showAdvancedParams)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              <Filter className="w-4 h-4" />
              高级搜索选项
              {showAdvancedParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedParams && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* 结果数量 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">结果数量</label>
                  <select
                    value={searchParams.count}
                    onChange={(e) => setSearchParams({...searchParams, count: e.target.value})}
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    <option value="5">5条</option>
                    <option value="10">10条</option>
                    <option value="20">20条</option>
                    <option value="50">50条</option>
                  </select>
                </div>

                {/* 时间范围 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">时间范围</label>
                  <select
                    value={searchParams.freshness}
                    onChange={(e) => setSearchParams({...searchParams, freshness: e.target.value})}
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    <option value="">全部时间</option>
                    <option value="Day">最近一天</option>
                    <option value="Week">最近一周</option>
                    <option value="Month">最近一个月</option>
                  </select>
                </div>

                {/* 安全搜索 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">安全搜索</label>
                  <select
                    value={searchParams.safeSearch}
                    onChange={(e) => setSearchParams({...searchParams, safeSearch: e.target.value})}
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    <option value="Off">关闭</option>
                    <option value="Moderate">中等</option>
                    <option value="Strict">严格</option>
                  </select>
                </div>

                {/* 市场/语言 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">搜索市场</label>
                  <select
                    value={searchParams.mkt}
                    onChange={(e) => setSearchParams({...searchParams, mkt: e.target.value})}
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    <option value="zh-CN">中国 (简体中文)</option>
                    <option value="zh-TW">台湾 (繁体中文)</option>
                    <option value="en-US">美国 (英语)</option>
                    <option value="en-GB">英国 (英语)</option>
                    <option value="ja-JP">日本 (日语)</option>
                    <option value="ko-KR">韩国 (韩语)</option>
                  </select>
                </div>

                {/* 国家/地区 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">国家/地区</label>
                  <select
                    value={searchParams.cc}
                    onChange={(e) => setSearchParams({...searchParams, cc: e.target.value})}
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                  >
                    <option value="CN">中国</option>
                    <option value="TW">台湾</option>
                    <option value="US">美国</option>
                    <option value="GB">英国</option>
                    <option value="JP">日本</option>
                    <option value="KR">韩国</option>
                  </select>
                </div>

                {/* 偏移量 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">结果偏移</label>
                  <input
                    type="number"
                    value={searchParams.offset}
                    onChange={(e) => setSearchParams({...searchParams, offset: e.target.value})}
                    min="0"
                    step="10"
                    className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSearching}
                    placeholder="0"
                  />
                </div>

                {/* 重置按钮 */}
                <div className="flex items-end">
                  <button
                    onClick={() => setSearchParams({
                      count: '10',
                      freshness: '',
                      offset: '0',
                      mkt: 'zh-CN',
                      cc: 'CN',
                      safeSearch: 'Moderate',
                      setLang: 'zh-CN'
                    })}
                    className="w-full p-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                    disabled={isSearching}
                  >
                    重置默认值
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 搜索结果显示区域 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isSearching ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {selectedModel === 'SmartSearch' ? '🧠 AI正在智能分析...' : '📄 正在全文搜索...'}
              </p>
            </div>
          </div>
        ) : selectedSearchResult ? (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold mb-2">{selectedSearchResult.query}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                <span>{selectedSearchResult.model === 'SmartSearch' ? '🧠 智能搜索' : '📄 全文搜索'}</span>
                <span>{selectedSearchResult.timestamp.toLocaleString()}</span>
              </div>

              {/* 显示搜索参数 */}
              {selectedSearchResult.searchParams && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">搜索参数</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-600">
                    <div>结果数: {selectedSearchResult.searchParams.count || '10'}</div>
                    <div>时间: {selectedSearchResult.searchParams.freshness || '全部'}</div>
                    <div>安全: {selectedSearchResult.searchParams.safeSearch || 'Moderate'}</div>
                    <div>地区: {selectedSearchResult.searchParams.cc || 'CN'}</div>
                    {selectedSearchResult.searchParams.offset !== '0' && (
                      <div>偏移: {selectedSearchResult.searchParams.offset}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedSearchResult.results && selectedSearchResult.results.length > 0 ? (
              <div className="space-y-4">
                {/* 搜索概述信息 */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {selectedSearchResult.model === 'SmartSearch' ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          🧠
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          📄
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 font-medium">
                        {selectedSearchResult.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 搜索结果统计和排序信息 */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="text-sm text-gray-600">
                    为您找到相关结果约 <span className="font-medium text-gray-800">{selectedSearchResult.results.length}</span> 个
                    {selectedSearchResult.searchParams?.offset &&
                     parseInt(selectedSearchResult.searchParams.offset) > 0 && (
                      <span className="ml-2 text-gray-500">
                        (第 {parseInt(selectedSearchResult.searchParams.offset) + 1} - {parseInt(selectedSearchResult.searchParams.offset) + selectedSearchResult.results.length} 个)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedSearchResult.model === 'SmartSearch' ? '按相关度排序' : '按匹配度排序'}
                  </div>
                </div>

                {/* 搜索结果列表 */}
                <div className="space-y-5">
                  {selectedSearchResult.results.map((item, index) => (
                    <div key={index} className="group">
                      {/* 标题 - 可点击链接 */}
                      <h3 className="mb-1">
                        <a
                          href={item.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xl text-blue-600 hover:text-blue-800 hover:underline font-normal leading-snug block group-hover:underline"
                          title={item.title || item.name}
                        >
                          {item.title || item.name || `结果 ${index + 1}`}
                        </a>
                      </h3>

                      {/* 链接地址、发布时间、来源 */}
                      <div className="flex items-center gap-1 mb-2 text-sm text-green-600">
                        <span className="truncate max-w-lg">
                          {item.displayUrl || item.url || 'N/A'}
                        </span>
                        {item.datePublished && (
                          <>
                            <span className="text-gray-400 mx-1">•</span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {new Date(item.datePublished).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </span>
                          </>
                        )}
                        {item.siteName && (
                          <>
                            <span className="text-gray-400 mx-1">•</span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {item.siteName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* 摘要内容 */}
                      <div className="flex gap-3">
                        {/* 缩略图（如果有） */}
                        {item.thumbnailUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title || 'thumbnail'}
                              className="w-20 h-20 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {item.snippet || item.content || '暂无摘要信息'}
                          </p>

                          {/* 全文搜索的完整内容预览 */}
                          {selectedSearchResult.model === 'FullTextSearch' && item.fullContent &&
                           item.fullContent !== item.snippet && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-orange-300">
                              <div className="font-medium text-orange-700 mb-1">完整内容预览：</div>
                              <div className="line-clamp-2">
                                {item.fullContent.substring(0, 200)}
                                {item.fullContent.length > 200 ? '...' : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 分隔线 */}
                      {index < selectedSearchResult.results.length - 1 && (
                        <div className="mt-4 border-b border-gray-100"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">未找到相关内容</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Search className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">选择一个搜索记录</p>
              <p className="text-sm">点击左侧的搜索历史来查看详细结果</p>
            </div>
          </div>
        )}
      </div>

      {/* 配置提示弹窗 */}
      {showConfigHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-700">⚠ 需要配置搜索端点</h3>
              <button
                onClick={() => setShowConfigHelp(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-3">
                  🔍 <strong>搜索功能需要配置专用端点</strong>
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  为了使用智能搜索和全文搜索功能，需要先在统一配置管理中设置搜索端点ID。
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>配置步骤：</strong></p>
                  <p>1. 点击页面左上角的设置按钮</p>
                  <p>2. 选择"搜索功能"标签页</p>
                  <p>3. 填写搜索端点ID</p>
                  <p>4. 保存配置后即可使用搜索功能</p>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700">
                  💡 <strong>温馨提示</strong>: 统一配置管理可以一次性设置所有功能的端点，避免重复配置。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowConfigHelp(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}