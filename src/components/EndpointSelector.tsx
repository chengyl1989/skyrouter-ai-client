import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { createApiClient } from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Endpoint {
  path: string;
  status: 'recommended' | 'suggested' | 'fallback';
  note?: string;
}

interface EndpointsResponse {
  endpoints: {
    mj: Endpoint[];
    hl: Endpoint[];
  };
  note?: string;
}

interface EndpointSelectorProps {
  type: 'mj' | 'hl';
  onSelect: (endpointPath: string) => void;
  onCancel: () => void;
}

export function EndpointSelector({ type, onSelect, onCancel }: EndpointSelectorProps) {
  const { apiConfig } = useStore();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    if (!apiConfig) {
      setError('请先配置API设置');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createApiClient(apiConfig);
      const response = await fetch('/api/endpoints', {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'X-API-Endpoint': apiConfig.endpoint,
        },
      });

      if (!response.ok) {
        throw new Error(`获取endpoints失败: ${response.status}`);
      }

      const data: EndpointsResponse = await response.json();
      const typeEndpoints = data.endpoints[type] || [];
      
      setEndpoints(typeEndpoints);
      
      // 自动选择推荐的endpoint
      const recommended = typeEndpoints.find(ep => ep.status === 'recommended');
      if (recommended) {
        setSelectedEndpoint(recommended.path);
      } else if (typeEndpoints.length > 0) {
        setSelectedEndpoint(typeEndpoints[0].path);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取endpoints失败';
      setError(errorMessage);
      
      // 提供fallback
      const fallbackEndpoint = type === 'mj' 
        ? 'v1/ai/eljciTfuqTxBSjXl' 
        : 'UfRLJwuMWPdfKWQg';
        
      setEndpoints([{
        path: fallbackEndpoint,
        status: 'fallback',
        note: 'Fallback endpoint'
      }]);
      setSelectedEndpoint(fallbackEndpoint);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedEndpoint) {
      onSelect(selectedEndpoint);
    }
  };

  const getTypeLabel = () => {
    return type === 'mj' ? 'MaaS-MJ 图像生成' : 'MaaS-HL 视频生成';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recommended': return 'text-green-600 bg-green-100';
      case 'suggested': return 'text-blue-600 bg-blue-100';
      case 'fallback': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recommended': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'suggested': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'fallback': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">选择 {getTypeLabel()} Endpoint</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>检测可用endpoints...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 py-4">
            <p>{error}</p>
            <button 
              onClick={fetchEndpoints}
              className="mt-2 text-blue-600 hover:underline"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              请选择用于{getTypeLabel()}的专用endpoint路径：
            </p>
            
            {endpoints.map((endpoint) => (
              <label
                key={endpoint.path}
                className={`block p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedEndpoint === endpoint.path 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="endpoint"
                    value={endpoint.path}
                    checked={selectedEndpoint === endpoint.path}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(endpoint.status)}
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status === 'recommended' ? '推荐' : 
                         endpoint.status === 'suggested' ? '建议' : '备用'}
                      </span>
                    </div>
                    {endpoint.note && (
                      <p className="text-xs text-gray-500 mt-1">{endpoint.note}</p>
                    )}
                  </div>
                </div>
              </label>
            ))}
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-700">
                💡 <strong>提示:</strong> 这些endpoint路径基于您的API权限检测。如果遇到问题，请检查SkyRouter控制台中的专用路径配置。
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedEndpoint || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认使用
          </button>
        </div>
      </div>
    </div>
  );
}