import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { createApiClient } from '@/lib/api';
import { categorizeModels } from '@/lib/modelUtils';

// 添加缓存机制
let endpointConfigCache: any = null;
let lastConfigTime = 0;
const CONFIG_CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

export interface ModelInfo {
  id: string;
  created: string;
  object: string;
  owned_by: string;
}

export interface CategorizedModels {
  chat: ModelInfo[];
  image: ModelInfo[];
  video: ModelInfo[];
  speech: ModelInfo[];
  embedding: ModelInfo[];
  other: ModelInfo[];
}

export function useModels(autoFetch: boolean = true) {
  const { apiConfig } = useStore();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfiguringRef = useRef(false); // 使用useRef防止竞态条件

  const fetchModels = async () => {
    if (!apiConfig) {
      setError('请先配置API设置');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createApiClient(apiConfig);
      
      // 获取模型列表
      const response = await client.getModels();
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Available models:', response.data);
        setModels(response.data);
        
        // 不再自动配置endpoints，改为按需配置
        // await autoConfigureEndpoints(response.data);
      } else {
        throw new Error('无效的模型列表响应格式');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模型列表失败';
      console.error('Models fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const autoConfigureEndpoints = async (models: ModelInfo[]) => {
    try {
      // 防止重复调用 - 使用useRef
      if (isConfiguringRef.current) {
        console.log('Configuration already in progress, skipping...');
        return;
      }

      // 检查缓存
      const currentTime = Date.now();
      if (endpointConfigCache && (currentTime - lastConfigTime) < CONFIG_CACHE_DURATION) {
        console.log('Using cached endpoint configuration');
        const store = useStore.getState();
        store.setApiConfig({
          ...store.apiConfig!,
          ...endpointConfigCache
        });
        return;
      }

      isConfiguringRef.current = true;

      // 动态获取模型配置
      const client = createApiClient(apiConfig!);
      
      console.log('Fetching dynamic model configurations...');
      
      const configResponse = await fetch('/api/models/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiConfig!.apiKey}`,
          'X-API-Endpoint': apiConfig!.endpoint,
        },
      });

      if (!configResponse.ok) {
        console.error('Failed to fetch model configs:', configResponse.status);
        // 如果动态检测失败，回退到静态配置
        console.log('Falling back to static endpoint configuration...');
        await fallbackStaticConfiguration(models);
        return;
      }

      const configData = await configResponse.json();
      console.log('Received model configurations:', configData);

      if (configData.modelConfigs) {
        const store = useStore.getState();
        
        // 分别提取MJ和HL模型的配置
        const mjModelEndpoints: Record<string, string> = {};
        const hlModelEndpoints: Record<string, string> = {};
        let mjEndpointPath = '';
        let hlEndpointPath = '';

        Object.entries(configData.modelConfigs).forEach(([modelId, config]: [string, any]) => {
          if (config.type === 'mj_image') {
            mjModelEndpoints[modelId] = config.endpoint;
            if (!mjEndpointPath) mjEndpointPath = config.endpoint;
          } else if (config.type === 'hl_video') {
            hlModelEndpoints[modelId] = config.endpoint;
            if (!hlEndpointPath) hlEndpointPath = config.endpoint;
          }
        });

        const updatedConfig = {
          ...store.apiConfig!,
          mjEndpointPath: mjEndpointPath || store.apiConfig?.mjEndpointPath || '',
          hlEndpointPath: hlEndpointPath || store.apiConfig?.hlEndpointPath || '',
          hlModelEndpoints: Object.keys(hlModelEndpoints).length > 0 ? hlModelEndpoints : store.apiConfig?.hlModelEndpoints || {},
          mjModelEndpoints: Object.keys(mjModelEndpoints).length > 0 ? mjModelEndpoints : store.apiConfig?.mjModelEndpoints || {}
        };

        console.log('Auto-configuring endpoints with dynamic detection:', {
          mjModelsCount: Object.keys(mjModelEndpoints).length,
          hlModelsCount: Object.keys(hlModelEndpoints).length,
          mjEndpoint: updatedConfig.mjEndpointPath,
          hlEndpoint: updatedConfig.hlEndpointPath,
          hlModelEndpoints: updatedConfig.hlModelEndpoints,
          mjModelEndpoints: updatedConfig.mjModelEndpoints,
          detectionMethod: configData.detectionMethod
        });

        // 保存到缓存
        endpointConfigCache = {
          mjEndpointPath: updatedConfig.mjEndpointPath,
          hlEndpointPath: updatedConfig.hlEndpointPath,
          hlModelEndpoints: updatedConfig.hlModelEndpoints,
          mjModelEndpoints: updatedConfig.mjModelEndpoints
        };
        lastConfigTime = Date.now();

        store.setApiConfig(updatedConfig);
      } else {
        // 如果没有配置数据，回退到静态配置
        console.log('No model configs found, falling back to static configuration...');
        await fallbackStaticConfiguration(models);
      }
    } catch (error) {
      console.error('Dynamic endpoint configuration failed:', error);
      
      // 如果动态检测失败，回退到静态配置
      console.log('Falling back to static endpoint configuration...');
      await fallbackStaticConfiguration(models);
    } finally {
      isConfiguringRef.current = false; // 确保重置状态
    }
  };

  // 静态配置作为回退方案
  const fallbackStaticConfiguration = async (models: ModelInfo[]) => {
    try {
      const mjModels = models.filter(model => {
        const id = model.id.toLowerCase();
        return id.includes('mj') || id.includes('midjourney');
      });

      const hlModels = models.filter(model => {
        const id = model.id.toLowerCase();
        return id.includes('hl_video') || id.includes('hailuo');
      });

      if (mjModels.length > 0 || hlModels.length > 0) {
        const store = useStore.getState();
        
        const updatedConfig = {
          ...store.apiConfig!,
          mjEndpointPath: mjModels.length > 0 ? 'v1/ai/eljciTfuqTxBSjXl' : store.apiConfig?.mjEndpointPath || '',
          hlEndpointPath: hlModels.length > 0 ? 'UfRLJwuMWPdfKWQg' : store.apiConfig?.hlEndpointPath || '',
        };

        console.log('Static fallback configuration applied');
        store.setApiConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Static fallback configuration failed:', error);
    }
  };



  // 只在autoFetch为true时自动获取模型列表
  useEffect(() => {
    if (apiConfig && autoFetch) {
      fetchModels();
    } else if (!apiConfig) {
      setModels([]);
      setError(null);
    }
  }, [apiConfig, autoFetch]);

  return {
    models,
    categorizedModels: categorizeModels(models),
    loading,
    error,
    fetchModels,
    refresh: fetchModels,
    autoConfigureEndpoints: (models: ModelInfo[]) => autoConfigureEndpoints(models)
  };
}