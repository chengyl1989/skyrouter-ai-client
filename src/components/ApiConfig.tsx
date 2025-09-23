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
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center gap-2 p-6 border-b">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">统一配置管理</h2>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* 左侧标签页 */}
          <div className="w-48 border-r bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">配置类别</h3>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
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
                  <h3 className="text-lg font-medium mb-4">基础 API 配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">API Endpoint</label>
                      <input
                        type="text"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        placeholder="https://genaiapi.cloudsway.net"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        填写 API 服务的基础域名地址
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的 API Key"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        您的 API 访问密钥，用于身份验证
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    📋 配置说明
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
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
                  <h3 className="text-lg font-medium mb-4">搜索功能配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">搜索端点 ID</label>
                      <input
                        type="text"
                        value={searchEndpointId}
                        onChange={(e) => setSearchEndpointId(e.target.value)}
                        placeholder="例如: tAesCxARPArGsQKD"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        搜索服务的专用端点标识符
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-2">
                    🔍 搜索功能说明
                  </p>
                  <ul className="text-xs text-green-600 space-y-1">
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
                  <h3 className="text-lg font-medium mb-4">图片生成配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">MJ 端点路径</label>
                      <input
                        type="text"
                        value={mjEndpointPath}
                        onChange={(e) => setMjEndpointPath(e.target.value)}
                        placeholder="例如: abc123def456"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        MaaS-MJ 图片生成模型的专用端点路径
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium mb-2">
                    🎨 图片生成说明
                  </p>
                  <ul className="text-xs text-purple-600 space-y-1">
                    <li>• <strong>支持模型</strong>: DALL-E 3, MaaS Image 1, MaaS-MJ</li>
                    <li>• <strong>MJ模型</strong>: 需要配置专用端点路径</li>
                    <li>• <strong>其他模型</strong>: 使用基础 API 配置</li>
                    <li>• <strong>完整地址</strong>: {endpoint}/v1/ai/{mjEndpointPath || '[端点路径]'}</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">视频生成配置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">HL 端点路径</label>
                      <input
                        type="text"
                        value={hlEndpointPath}
                        onChange={(e) => setHlEndpointPath(e.target.value)}
                        placeholder="例如: xyz789abc123"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        MaaS-HL 视频生成模型的端点路径
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">KL 端点路径</label>
                      <input
                        type="text"
                        value={klEndpointPath}
                        onChange={(e) => setKlEndpointPath(e.target.value)}
                        placeholder="例如: klv123xyz456"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        MaaS-KL 视频生成模型的统一端点路径
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium mb-2">
                    🎬 视频生成说明
                  </p>
                  <ul className="text-xs text-orange-600 space-y-1">
                    <li>• <strong>HL模型</strong>: 支持文本转视频、图片转视频等</li>
                    <li>• <strong>KL模型</strong>: 所有KL系列模型共享统一端点</li>
                    <li>• <strong>输入支持</strong>: 文本、图片、音频</li>
                    <li>• <strong>HL地址</strong>: {endpoint}/v1/ai/{hlEndpointPath || '[HL端点]'}</li>
                    <li>• <strong>KL地址</strong>: {endpoint}/v1/ai/{klEndpointPath || '[KL端点]'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
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