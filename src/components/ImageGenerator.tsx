'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { createApiClient } from '@/lib/api';
import { GeneratedImage } from '@/types';
import { Send, Download, Loader2, Image as ImageIcon, RefreshCw, X, Palette, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        请先配置 API 设置
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-20 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full opacity-20 blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 p-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm shadow-lg">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" />
              图像模型:
            </label>
            {modelsLoading ? (
              <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-700 dark:text-purple-300">加载模型中...</span>
              </div>
            ) : modelsError ? (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-red-700 dark:text-red-300 truncate">{modelsError}</span>
                <button
                  onClick={refreshModels}
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors"
                  title="重试获取模型"
                >
                  <RefreshCw className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 modern-input"
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
                  <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium ${
                    selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney'))
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25'
                  }`}>
                    {selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney')) ? 'MJ模型' : '标准模型'}
                  </span>

                  {/* 配置状态指示器 */}
                  {selectedModel && (selectedModel.toLowerCase().includes('mj') || selectedModel.toLowerCase().includes('midjourney')) && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium ${
                        apiConfig?.mjEndpointPath
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                      }`}>
                        {apiConfig?.mjEndpointPath ? '✓ 已配置' : '⚠ 需配置'}
                      </span>

                      {!apiConfig?.mjEndpointPath && (
                        <motion.button
                          onClick={() => setShowConfigHelp(true)}
                          className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                          title="配置图像生成端点"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Wand2 className="w-3 h-3 inline mr-1" />
                          点击配置
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* 显示不可用模型提示 */}
                  {selectedModel && !isModelAvailable(selectedModel) && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl text-sm font-medium shadow-lg">
                      ⚠️ 该模型暂不可用
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="描述你想要生成的图片..."
              className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm min-h-[100px] bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 modern-input shadow-sm"
              rows={3}
              disabled={isGenerating}
              whileFocus={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <motion.button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || !isModelAvailable(selectedModel)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 min-h-[56px] whitespace-nowrap shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline font-medium">生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">生成图片</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-800 relative">
        {generatedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="relative mb-6">
              <ImageIcon className="w-20 h-20 sm:w-24 sm:h-24 opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-medium mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">开始你的创作之旅</p>
            <p className="text-sm sm:text-base text-center max-w-md">输入你想象的画面描述，让AI为你生成独特的艺术作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {generatedImages.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="group relative"
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="aspect-square relative overflow-hidden">
                    <motion.img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />

                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {image.prompt}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                        {image.model}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {image.createdAt.toLocaleDateString()}
                      </span>
                    </div>

                    <motion.button
                      onClick={() => downloadImage(image.url, `${image.id}.jpg`)}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-green-500/25 hover:shadow-green-500/40"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium">下载图片</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-orange-500" />
                需要配置图片生成端点
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      MJ图片生成需要配置专用端点
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 leading-relaxed">
                      为了使用MaaS-MJ图片生成功能，需要先在统一配置管理中设置MJ端点路径。
                    </p>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">配置步骤：</p>
                      <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                        <li>点击页面左上角的设置按钮</li>
                        <li>选择"图片生成"标签页</li>
                        <li>填写MJ端点路径</li>
                        <li>保存配置后即可使用MJ图片生成</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-2xl border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    温馨提示: 统一配置管理可以一次性设置所有功能的端点，避免重复配置。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <motion.button
                onClick={() => setShowConfigHelp(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                我知道了
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}