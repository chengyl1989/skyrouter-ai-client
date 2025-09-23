'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { createApiClient } from '@/lib/api';
import { GeneratedImage } from '@/types';
import { Send, Download, Loader2, Image as ImageIcon, RefreshCw, X } from 'lucide-react';

export function ImageGenerator() {
  const { apiConfig, generatedImages, addGeneratedImage, setApiConfig } = useStore();
  const { categorizedModels, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels(true);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [showConfigHelp, setShowConfigHelp] = useState(false);


  // 检查当前模型是否需要配置
  const needsConfiguration = (modelId: string) => {
    if (!modelId) return false;
    const id = modelId.toLowerCase();
    if (id.includes('mj') || id.includes('midjourney')) {
      return !apiConfig?.mjEndpointPath;
    }
    return false;
  };

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // 判断图像模型是否可用
  const isModelAvailable = (modelId: string) => {
    const id = modelId.toLowerCase();
    return (
      id === 'maas dall-e-3' ||
      id === 'maas_image_1' ||
      id === 'maas-mj'
    );
  };

  // 设置默认模型（优先选择可用模型）
  useEffect(() => {
    if (categorizedModels.image.length > 0 && !selectedModel) {
      // 优先选择可用的模型
      const availableModel = categorizedModels.image.find(model => isModelAvailable(model.id));
      if (availableModel) {
        setSelectedModel(availableModel.id);
      } else {
        // 如果没有可用模型，选择第一个模型
        setSelectedModel(categorizedModels.image[0].id);
      }
    }
  }, [categorizedModels.image, selectedModel]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiConfig) return;
    
    // 验证模型可用性
    if (!isModelAvailable(selectedModel)) {
      alert('所选模型暂不可用，请选择其他可用模型');
      return;
    }

    setIsGenerating(true);

    try {
      const client = createApiClient(apiConfig);
      const modelId = selectedModel.toLowerCase();
      
      // 检查是否为MaaS-MJ模型，使用专门的API
      if (modelId.includes('maas-mj')) {
        console.log('Using MaaS-MJ API for:', selectedModel);

        // 检查是否配置了MJ端点路径
        if (!apiConfig.mjEndpointPath) {
          setShowConfigHelp(true);
          setIsGenerating(false);
          return;
        }

        // 使用统一配置的MJ端点路径
        const mjEndpointPath = apiConfig.mjEndpointPath;
        console.log(`Using unified MJ endpoint:`, mjEndpointPath);
        
        const response = await fetch('/api/images/mj', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'X-API-Endpoint': apiConfig.endpoint,
            'X-MJ-Endpoint-Path': mjEndpointPath,
          },
          body: JSON.stringify({
            prompt
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle specific error types for MJ models
          if (errorData.type === 'content_policy_violation') {
            alert(`❌ ${errorData.error}\n\n${errorData.message}\n\n建议:\n${errorData.suggestions?.join('\n') || '请修改描述内容后重试'}`);
            return;
          } else if (errorData.type === 'quota_exceeded') {
            alert(`⚠️ ${errorData.error}\n\n${errorData.message}`);
            return;
          } else if (errorData.type === 'rate_limit_exceeded') {
            alert(`🔄 ${errorData.error}\n\n${errorData.message}`);
            return;
          }
          
          throw new Error(errorData.error || errorData.message || `MJ请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('MaaS-MJ response:', data);
        
        if (data.data && data.data.length > 0) {
          const imageData = data.data[0];
          const generatedImage: GeneratedImage = {
            id: generateId(),
            url: imageData.url,
            prompt,
            model: selectedModel,
            createdAt: new Date(),
          };
          
          addGeneratedImage(generatedImage);
          setPrompt('');
          return;
        }
      } else {
        // 普通图像模型处理
        // 构建通用的图像生成请求
        let request: any = {
          prompt,
          model: selectedModel,
          n: 1,
        };

        // 根据不同模型设置特定参数
        if (modelId.includes('dall-e')) {
          // DALL-E 模型参数
          request.size = '1024x1024';
          request.quality = 'hd';
          request.style = 'vivid';
        } else if (modelId.includes('stable') || modelId.includes('flux')) {
          // Stable Diffusion 或 Flux 模型参数
          request.width = 1024;
          request.height = 1024;
          request.steps = 30;
          request.cfg_scale = 7.5;
        } else if (modelId.includes('comfy')) {
          // ComfyUI 模型参数
          request.width = 1024;
          request.height = 1024;
        } else {
          // 默认参数适用于其他MaaS模型
          request.size = '1024x1024';
          request.quality = 'high';
          request.output_format = 'jpeg';
        }

        console.log('Sending image generation request:', request);
        const response = await client.generateImage(request);
        console.log('Image generation response:', response);
      
        if (response && response.data && response.data.length > 0) {
          const imageData = response.data[0];
          let imageUrl: string;
          
          // 处理不同的响应格式
          if (imageData.url) {
            // DALL-E 3 格式：直接返回URL
            imageUrl = imageData.url;
          } else if (imageData.b64_json) {
            // MaaS Image 1 格式：返回base64数据
            imageUrl = `data:image/jpeg;base64,${imageData.b64_json}`;
          } else {
            console.error('No valid image data found in response:', imageData);
            alert('生成图片失败: 无效的响应格式');
            return;
          }
          
          const generatedImage: GeneratedImage = {
            id: generateId(),
            url: imageUrl,
            prompt,
            model: selectedModel,
            createdAt: new Date(),
          };
          
          addGeneratedImage(generatedImage);
          setPrompt('');
        } else {
          console.error('Invalid response format:', response);
          alert('生成图片失败: 响应格式错误');
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Check if error has response data (from API)
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Try to parse the error message for API error data
        try {
          const errorMatch = error.message.match(/(\{.*\})/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[1]);
            
            // Handle specific error types
            if (errorData.type === 'content_policy_violation') {
              alert(`❌ ${errorData.error}\n\n${errorData.message}\n\n建议:\n${errorData.suggestions?.join('\n') || '请修改描述内容后重试'}`);
              return;
            } else if (errorData.type === 'quota_exceeded') {
              alert(`⚠️ ${errorData.error}\n\n${errorData.message}`);
              return;
            } else if (errorData.type === 'rate_limit_exceeded') {
              alert(`🔄 ${errorData.error}\n\n${errorData.message}`);
              return;
            } else if (errorData.type === 'authentication_failed') {
              alert(`🔑 ${errorData.error}\n\n${errorData.message}`);
              return;
            } else if (errorData.type === 'server_error') {
              alert(`🔧 ${errorData.error}\n\n${errorData.message}`);
              return;
            }
          }
        } catch (parseError) {
          // If parsing fails, continue with generic error handling
        }
        
        // Handle network and other errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          alert('❌ 网络连接失败\n\n请检查您的网络连接或API服务器状态。');
          return;
        } else if (error.message.includes('content_policy_violation')) {
          alert('❌ 内容安全检查失败\n\n您的图像生成请求被安全系统拒绝。请修改您的描述，避免使用可能违反内容政策的词汇。');
          return;
        }
      }
      
      // Generic error fallback
      alert(`❌ 生成图片失败\n\n${error instanceof Error ? error.message : '未知错误'}\n\n请稍后重试或联系技术支持。`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      let blob: Blob;
      
      if (url.startsWith('data:')) {
        // 处理base64格式的图片
        const response = await fetch(url);
        blob = await response.blob();
      } else {
        // 处理URL格式的图片
        const response = await fetch(url);
        blob = await response.blob();
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('下载失败');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
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
      {/* 生成控制面板 */}
      <div className="p-3 sm:p-4 border-b bg-white shadow-sm">
        <div className="space-y-3 sm:space-y-4">
          {/* 模型选择 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">图像模型:</label>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={isGenerating || categorizedModels.image.length === 0}
                >
                  {categorizedModels.image.length === 0 ? (
                    <option value="">无可用模型</option>
                  ) : (
                    categorizedModels.image.map(model => {
                      const available = isModelAvailable(model.id);
                      return (
                        <option 
                          key={model.id} 
                          value={model.id}
                          disabled={!available}
                          style={{ 
                            color: available ? 'inherit' : '#9ca3af',
                            backgroundColor: available ? 'inherit' : '#f3f4f6'
                          }}
                        >
                          {model.id} {!available ? '(暂不可用)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney'))
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney')) ? 'MJ模型' : '标准模型'}
                  </span>
                  
                  {/* 配置状态指示器 */}
                  {selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney')) && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        apiConfig?.mjEndpointPath
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {apiConfig?.mjEndpointPath ? '✓ 已配置' : '⚠ 需配置'}
                      </span>

                      {!apiConfig?.mjEndpointPath && (
                        <button
                          onClick={() => setShowConfigHelp(true)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="配置图像生成端点"
                        >
                          点击配置
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* 显示不可用模型提示 */}
                  {selectedModel && !isModelAvailable(selectedModel) && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                      ⚠️ 该模型暂不可用
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* 提示词输入 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="描述你想要生成的图片..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
              rows={3}
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || !isModelAvailable(selectedModel)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">生成中...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">生成</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 图片展示区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        {generatedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20 mb-4 opacity-50" />
            <p className="text-lg sm:text-xl font-medium mb-2">还没有生成任何图片</p>
            <p className="text-sm sm:text-base text-center">输入描述并点击生成按钮开始创作</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {generatedImages.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {image.prompt}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span className="truncate font-medium">{image.model}</span>
                    <span className="whitespace-nowrap ml-2">{image.createdAt.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => downloadImage(image.url, `${image.id}.jpg`)}
                    className="w-full bg-green-500 text-white py-2.5 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 配置提示弹窗 */}
      {showConfigHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-700">⚠ 需要配置图片生成端点</h3>
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
                  🎨 <strong>MJ图片生成需要配置专用端点</strong>
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  为了使用MaaS-MJ图片生成功能，需要先在统一配置管理中设置MJ端点路径。
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>配置步骤：</strong></p>
                  <p>1. 点击页面左上角的设置按钮</p>
                  <p>2. 选择"图片生成"标签页</p>
                  <p>3. 填写MJ端点路径</p>
                  <p>4. 保存配置后即可使用MJ图片生成</p>
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