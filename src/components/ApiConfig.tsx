'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ApiConfig } from '@/types';
import { Settings } from 'lucide-react';

export function ApiConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { apiConfig, setApiConfig } = useStore();
  const [endpoint, setEndpoint] = useState(apiConfig?.endpoint || 'https://genaiapi.cloudsway.net');
  const [apiKey, setApiKey] = useState(apiConfig?.apiKey || '');

  const handleSave = () => {
    if (endpoint && apiKey) {
      const config: ApiConfig = { 
        endpoint, 
        apiKey,
        // 不预设MJ和HL endpoints，将在获取模型时自动配置
        mjEndpointPath: '',
        hlEndpointPath: '',
        hlModelEndpoints: {}
      };
      setApiConfig(config);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          <h2 className="text-lg font-semibold">API 配置</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Endpoint</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://genaiapi.cloudsway.net"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入您的 API Key"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              📋 <strong>配置说明:</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              • <strong>API Endpoint</strong>: 填写基础域名，如: <code>https://genaiapi.cloudsway.net</code><br/>
              • <strong>视频模型endpoint</strong>: 在视频页面单独配置MJ模型的路径<br/>
              • <strong>MJ模型endpoint</strong>: 在图像页面单独配置MJ模型的路径
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!endpoint || !apiKey}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}