'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ApiConfig } from '@/types';
import { Settings, Server, Search, Image, Video, MessageSquare } from 'lucide-react';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'basic', label: '基础配置', icon: <Settings className="w-4 h-4" /> },
  { id: 'search', label: '搜索功能', icon: <Search className="w-4 h-4" /> },
  { id: 'image', label: '图片生成', icon: <Image className="w-4 h-4" /> },
  { id: 'video', label: '视频生成', icon: <Video className="w-4 h-4" /> },
];

export function ApiConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { apiConfig, setApiConfig } = useStore();
  const [activeTab, setActiveTab] = useState('basic');

  // 基础配置
  const [endpoint, setEndpoint] = useState(apiConfig?.endpoint || 'https://genaiapi.cloudsway.net');
  const [apiKey, setApiKey] = useState(apiConfig?.apiKey || '');

  // 搜索配置
  const [searchEndpointId, setSearchEndpointId] = useState(apiConfig?.searchEndpointId || '');

  // 图片生成配置
  const [mjEndpointPath, setMjEndpointPath] = useState(apiConfig?.mjEndpointPath || '');

  // 视频生成配置
  const [hlEndpointPath, setHlEndpointPath] = useState(apiConfig?.hlEndpointPath || '');
  const [klEndpointPath, setKlEndpointPath] = useState(apiConfig?.klEndpointPath || '');

  const handleSave = () => {
    if (endpoint && apiKey) {
      const config: ApiConfig = {
        endpoint,
        apiKey,
        // 搜索配置
        searchEndpointId: searchEndpointId || undefined,
        // 图片生成配置
        mjEndpointPath: mjEndpointPath || undefined,
        mjModelEndpoints: apiConfig?.mjModelEndpoints || {},
        // 视频生成配置
        hlEndpointPath: hlEndpointPath || undefined,
        klEndpointPath: klEndpointPath || undefined,
        hlModelEndpoints: apiConfig?.hlModelEndpoints || {}
      };
      setApiConfig(config);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center gap-2 p-6 border-b dark:border-gray-700">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">统一配置管理</h2>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* 左侧标签页 */}
          <div className="w-48 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">配置类别</h3>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 右侧配置内容 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">基础 API 配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Endpoint</label>
                      <input
                        type="text"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        placeholder="https://genaiapi.cloudsway.net"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        填写 API 服务的基础域名地址
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的 API Key"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        您的 API 访问密钥，用于身份验证
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                    📋 配置说明
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• 基础配置是所有功能的前置条件</li>
                    <li>• 配置完成后，可在其他标签页配置专用功能</li>
                    <li>• 所有配置会自动保存到本地存储</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">搜索功能配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">搜索端点 ID</label>
                      <input
                        type="text"
                        value={searchEndpointId}
                        onChange={(e) => setSearchEndpointId(e.target.value)}
                        placeholder="例如: tAesCxARPArGsQKD"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        搜索服务的专用端点标识符
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                    🔍 搜索功能说明
                  </p>
                  <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                    <li>• <strong>智能搜索</strong>: AI 语义理解，按相关度排序</li>
                    <li>• <strong>全文搜索</strong>: 精确关键词匹配</li>
                    <li>• <strong>共享端点</strong>: 两种搜索模式使用同一个端点配置</li>
                    <li>• <strong>完整地址</strong>: {endpoint}/search/{searchEndpointId || '[端点ID]'}/smart</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">图片生成配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">MJ 端点路径</label>
                      <input
                        type="text"
                        value={mjEndpointPath}
                        onChange={(e) => setMjEndpointPath(e.target.value)}
                        placeholder="例如: abc123def456"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        MaaS-MJ 图片生成模型的专用端点路径
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
                    🎨 图片生成说明
                  </p>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    • <strong>MJ模型</strong>: 需要配置专用的endpoint路径<br/>
                    • <strong>路径格式</strong>: 仅填写路径部分，如 v1/ai/eljciTfuqTxBSjXl<br/>
                    • <strong>完整地址</strong>: {endpoint}/{mjEndpointPath || '[您填写的路径]'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">视频生成配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">HL 端点路径</label>
                      <input
                        type="text"
                        value={hlEndpointPath}
                        onChange={(e) => setHlEndpointPath(e.target.value)}
                        placeholder="例如: xyz789abc123"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        MaaS-HL 视频生成模型的端点路径
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">KL 端点路径</label>
                      <input
                        type="text"
                        value={klEndpointPath}
                        onChange={(e) => setKlEndpointPath(e.target.value)}
                        placeholder="例如: klv123xyz456"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        MaaS-KL 视频生成模型的统一端点路径
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">
                    🎬 视频生成说明
                  </p>
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    • <strong>HL视频模型</strong>: 需要配置专用的endpoint路径<br/>
                    • <strong>路径格式</strong>: 可填写ID或完整路径<br/>
                    • <strong>示例</strong>: UfRLJwuMWPdfKWQg<br/>
                    • <strong>完整地址</strong>: {endpoint}/v1/ai/[您填写的路径]<br/><br/>
                    • <strong>KL模型配置</strong>: 所有KL模型共享同一个endpoint配置<br/>
                    • <strong>重要提示</strong>: endpoint路径决定实际使用的模型版本<br/>
                    • <strong>V1.6示例</strong>: alhWUjkMbVNjpfNF<br/>
                    • <strong>V2.1示例</strong>: ktSHZuyRgirDspgK<br/>
                    • <strong>完整地址</strong>: {endpoint}/v1/ai/[您填写的路径]
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!endpoint || !apiKey}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            保存所有配置
          </button>
        </div>
      </div>
    </div>
  );
}