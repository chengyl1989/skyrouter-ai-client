import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { createApiClient } from '@/lib/api';

export interface HLEndpoint {
  path: string;
  status: 'available' | 'unknown' | 'fallback' | 'recommended';
  tested: boolean;
  note?: string;
  error?: string;
}

export interface HLEndpointsResponse {
  availableEndpoints: HLEndpoint[];
  recommended: string;
  note?: string;
}

export function useHLEndpoints() {
  const { apiConfig, setApiConfig } = useStore();
  const [endpoints, setEndpoints] = useState<HLEndpoint[]>([]);
  const [recommended, setRecommended] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHLEndpoints = async () => {
    if (!apiConfig) {
      setError('请先配置API设置');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createApiClient(apiConfig);
      const response: HLEndpointsResponse = await client.getHLEndpoints();
      
      console.log('HL endpoints response:', response);
      
      if (response.availableEndpoints && Array.isArray(response.availableEndpoints)) {
        setEndpoints(response.availableEndpoints);
        setRecommended(response.recommended || 'UfRLJwuMWPdfKWQg');
        
        // 如果当前配置没有hlEndpointPath，自动设置推荐的
        if (!apiConfig.hlEndpointPath && response.recommended) {
          console.log('Auto-setting HL endpoint to:', response.recommended);
          setApiConfig({
            ...apiConfig,
            hlEndpointPath: response.recommended
          });
        }
      } else {
        throw new Error('无效的HL endpoints响应格式');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取HL endpoints失败';
      console.error('HL endpoints fetch error:', errorMessage);
      setError(errorMessage);
      
      // 设置fallback
      setEndpoints([{
        path: 'UfRLJwuMWPdfKWQg',
        status: 'fallback',
        tested: false,
        note: 'Default recommended endpoint'
      }]);
      setRecommended('UfRLJwuMWPdfKWQg');
      
      // 自动设置fallback endpoint
      if (!apiConfig.hlEndpointPath) {
        setApiConfig({
          ...apiConfig,
          hlEndpointPath: 'UfRLJwuMWPdfKWQg'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 手动设置HL endpoint
  const setHLEndpoint = (endpointPath: string) => {
    if (apiConfig) {
      console.log('Setting HL endpoint to:', endpointPath);
      setApiConfig({
        ...apiConfig,
        hlEndpointPath: endpointPath
      });
    }
  };

  // 自动获取HL endpoints当API配置改变时
  useEffect(() => {
    if (apiConfig && apiConfig.apiKey && apiConfig.endpoint) {
      fetchHLEndpoints();
    } else {
      setEndpoints([]);
      setRecommended('');
      setError(null);
    }
  }, [apiConfig?.apiKey, apiConfig?.endpoint]);

  return {
    endpoints,
    recommended,
    loading,
    error,
    fetchHLEndpoints,
    setHLEndpoint,
    refresh: fetchHLEndpoints
  };
}