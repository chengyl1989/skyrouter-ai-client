import { NextRequest, NextResponse } from 'next/server';

// 添加内存缓存
let endpointDetectionCache: any = null;
let lastDetectionTime = 0;
const DETECTION_CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存，比前端缓存时间长

// 获取模型的详细配置信息，包括endpoint路径
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiEndpoint = request.headers.get('x-api-endpoint') || 'https://genaiapi.cloudsway.net';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // 获取模型配置信息的API端点
    // 这里假设API提供了一个端点来获取模型配置，如果没有，我们需要询问正确的API端点
    const configEndpoint = `${apiEndpoint}/v1/models/config`;
    
    console.log('Fetching models config from:', configEndpoint);

    const response = await fetch(configEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('Models config response status:', response.status);

    if (!response.ok) {
      // 如果配置端点不存在，我们返回一个默认的配置结构
      // 但标记为需要手动配置
      if (response.status === 404) {
        console.log('Config endpoint not found, using fallback detection');
        
        // 获取基础模型列表
        const modelsResponse = await fetch(`${apiEndpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
          },
        });

        if (!modelsResponse.ok) {
          throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
        }

        const modelsData = await modelsResponse.json();
        
        // 尝试获取每个模型的详细配置信息
        return await fetchIndividualModelConfigs(modelsData, authHeader, apiEndpoint);
      }

      const errorText = await response.text();
      console.error('Models config API error response:', errorText);
      return NextResponse.json(
        { error: `Config API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Models config data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Models config proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 尝试为每个模型获取详细配置信息
async function fetchIndividualModelConfigs(modelsData: any, authHeader: string, apiBaseUrl: string) {
  // 检查缓存
  const currentTime = Date.now();
  if (endpointDetectionCache && (currentTime - lastDetectionTime) < DETECTION_CACHE_DURATION) {
    console.log('Using cached endpoint detection results');
    return NextResponse.json(endpointDetectionCache);
  }

  const modelConfigs: Record<string, { endpoint: string; type: string; realModelId?: string }> = {};
  
  if (!modelsData.data || !Array.isArray(modelsData.data)) {
    throw new Error('Invalid models data format');
  }

  console.log('Trying to fetch individual model configurations...');

  // 尝试为视频模型获取详细配置
  const videoModels = modelsData.data.filter((model: any) => {
    const id = model.id.toLowerCase();
    return id.includes('video') || id.includes('hl_video') || id.includes('haiper');
  });

  console.log(`Found ${videoModels.length} video models to configure`);

  for (const model of videoModels) {
    const modelId = model.id;
    
    try {
      // 尝试调用模型详情API
      const modelDetailUrl = `${apiBaseUrl}/v1/models/${modelId}`;
      console.log(`Fetching details for model ${modelId} from: ${modelDetailUrl}`);
      
      const detailResponse = await fetch(modelDetailUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      });

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        console.log(`Model ${modelId} detail response:`, detailData);
        
        // 检查详情中是否包含endpoint信息
        if (detailData.endpoint || detailData.api_endpoint || detailData.service_endpoint) {
          const endpoint = detailData.endpoint || detailData.api_endpoint || detailData.service_endpoint;
          const realModelId = detailData.real_model_id || detailData.actual_model || modelId;
          
          modelConfigs[modelId] = {
            endpoint: endpoint,
            type: getModelType(modelId),
            realModelId: realModelId
          };
          
          console.log(`Configured ${modelId}: endpoint=${endpoint}, realModelId=${realModelId}`);
        } else {
          // 如果没有找到endpoint信息，使用默认配置
          modelConfigs[modelId] = {
            endpoint: getDefaultEndpointForModel(modelId),
            type: getModelType(modelId),
            realModelId: modelId
          };
          console.log(`Using default config for ${modelId}`);
        }
      } else {
        console.log(`Failed to fetch details for ${modelId}: ${detailResponse.status}`);
        // 使用默认配置
        modelConfigs[modelId] = {
          endpoint: getDefaultEndpointForModel(modelId),
          type: getModelType(modelId),
          realModelId: modelId
        };
      }
    } catch (error) {
      console.log(`Error fetching details for ${modelId}:`, error);
      // 使用默认配置
      modelConfigs[modelId] = {
        endpoint: getDefaultEndpointForModel(modelId),
        type: getModelType(modelId),
        realModelId: modelId
      };
    }
  }

  const result = {
    modelConfigs,
    detectionMethod: 'individual_model_fetch',
    timestamp: new Date().toISOString()
  };

  // 保存到缓存
  endpointDetectionCache = result;
  lastDetectionTime = Date.now();
  
  console.log('Individual model configuration completed and cached');

  return NextResponse.json(result);
}

// 根据模型ID获取默认endpoint
function getDefaultEndpointForModel(modelId: string): string {
  const id = modelId.toLowerCase();
  
  if (id.includes('maas_hl_video')) {
    return 'UfRLJwuMWPdfKWQg';
  } else if (id.includes('haiper')) {
    return 'haiper_default_endpoint'; // 需要确认
  } else if (id.includes('mj')) {
    return 'v1/ai/eljciTfuqTxBSjXl';
  }
  
  return 'default_endpoint';
}

// 根据模型ID获取模型类型
function getModelType(modelId: string): string {
  const id = modelId.toLowerCase();
  
  if (id.includes('hl_video')) {
    return 'hl_video';
  } else if (id.includes('haiper')) {
    return 'haiper_video';
  } else if (id.includes('mj')) {
    return 'mj_image';
  }
  
  return 'unknown';
}

// 智能检测模型的endpoint配置
async function detectModelEndpoints(modelsData: any, authHeader: string, apiBaseUrl: string) {
  // 检查缓存
  const currentTime = Date.now();
  if (endpointDetectionCache && (currentTime - lastDetectionTime) < DETECTION_CACHE_DURATION) {
    console.log('Using cached endpoint detection results');
    return NextResponse.json(endpointDetectionCache);
  }

  const modelConfigs: Record<string, { endpoint: string; type: string }> = {};
  
  if (!modelsData.data || !Array.isArray(modelsData.data)) {
    throw new Error('Invalid models data format');
  }

  console.log('Detecting endpoints for models (using known configurations)...');

  // 直接使用已知配置，不进行实际API测试
  modelsData.data.forEach((model: any) => {
    const modelId = model.id;
    
    // 为每个HL视频模型配置专属endpoint
    if (modelId.includes('MaaS_HL_Video') || modelId.includes('hl_video')) {
      // 根据模型类型分配不同的endpoint
      let endpoint = 'UfRLJwuMWPdfKWQg'; // 默认endpoint
      
      if (modelId.includes('s2v')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 语音生视频
      } else if (modelId.includes('t2v_director')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 文本生视频-导演版
      } else if (modelId.includes('t2v')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 文本生视频
      } else if (modelId.includes('i2v_live')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 图片生视频-实时版
      } else if (modelId.includes('i2v_director')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 图片生视频-导演版  
      } else if (modelId.includes('i2v')) {
        endpoint = 'UfRLJwuMWPdfKWQg'; // 图片生视频
      }
      
      modelConfigs[modelId] = {
        endpoint: endpoint,
        type: 'hl_video'
      };
      console.log(`Configured HL endpoint for ${modelId}: ${endpoint}`);
    }
    
    // 海派视频模型
    else if (modelId.includes('Haiper Video')) {
      modelConfigs[modelId] = {
        endpoint: 'haiper_endpoint', // 需要确认实际endpoint
        type: 'haiper_video'
      };
      console.log(`Configured Haiper endpoint for ${modelId}: haiper_endpoint`);
    }
    
    // 检测MJ图像模型
    else if (modelId.includes('MaaS-MJ') || modelId.includes('MJ')) {
      modelConfigs[modelId] = {
        endpoint: 'v1/ai/eljciTfuqTxBSjXl',
        type: 'mj_image'
      };
      console.log(`Configured MJ endpoint for ${modelId}: v1/ai/eljciTfuqTxBSjXl`);
    }
  });

  const result = {
    modelConfigs,
    detectionMethod: 'static_configuration',
    timestamp: new Date().toISOString()
  };

  // 保存到缓存
  endpointDetectionCache = result;
  lastDetectionTime = Date.now();
  
  console.log('Endpoint detection completed and cached (static configuration)');

  return NextResponse.json(result);
}

// 不再需要实际的endpoint测试函数，直接使用已知配置