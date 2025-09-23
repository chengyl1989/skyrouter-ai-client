'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useModels } from '@/hooks/useModels';
import { createApiClient } from '@/lib/api';
import { Send, Download, Loader2, Video as VideoIcon, RefreshCw, Upload, X } from 'lucide-react';

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: Date;
  inputType: 'text' | 'image' | 'speech';
  inputFile?: File;
}

export function VideoGenerator() {
  const { apiConfig, addGeneratedVideo, generatedVideos, setApiConfig } = useStore();
  const { categorizedModels, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels(true); // 自动获取模型
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image' | 'speech'>('text');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);


  // 判断是否为KL模型
  const isKLModel = (modelId: string) => {
    const id = modelId.toLowerCase();
    return id.includes('maas_kl_') || id.includes('kl_') || id.includes('keling');
  };



  // 检查当前模型是否需要配置
  const needsConfiguration = (modelId: string) => {
    if (!modelId) return false;
    const id = modelId.toLowerCase();

    // KL模型检查统一的KL endpoint配置
    if (id.includes('maas_kl_') || id.includes('kl_') || id.includes('keling')) {
      return !apiConfig?.klEndpointPath;
    }

    // HL模型检查统一的HL endpoint配置
    if (id.includes('hl_video') || id.includes('maas_hl_video')) {
      return !apiConfig?.hlEndpointPath;
    }

    return false;
  };

  // 监听API配置变化
  useEffect(() => {
    // 不再需要监听配置变化，因为使用统一配置
  }, [apiConfig, selectedModel]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // 设置默认模型（优先选择可用的MaaS_HL_Video_t2v）
  useEffect(() => {
    if (categorizedModels.video.length > 0 && !selectedModel) {
      // 优先选择可用的模型
      const availableModel = categorizedModels.video.find(model => isModelAvailable(model.id));
      if (availableModel) {
        setSelectedModel(availableModel.id);
      } else {
        // 如果没有可用模型，选择第一个模型
        setSelectedModel(categorizedModels.video[0].id);
      }
    }
  }, [categorizedModels.video, selectedModel]);

  // 根据模型判断输入类型
  const getModelInputType = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('t2v')) return 'text';
    if (id.includes('i2v')) return 'image';  
    if (id.includes('s2v')) return 'speech';
    return 'text'; // 默认文本输入
  };

  // 判断模型是否可用
  const isModelAvailable = (modelId: string) => {
    const id = modelId.toLowerCase();
    return id === 'maas_hl_video_t2v' || 
           id.includes('maas_kl_') || 
           id.includes('kl_v') ||
           id.includes('keling');
  };

  // 当模型改变时，自动切换输入类型（但只对可用模型生效）
  useEffect(() => {
    if (selectedModel && isModelAvailable(selectedModel)) {
      const newInputType = getModelInputType(selectedModel);
      setInputType(newInputType);
      setInputFile(null); // 清空文件
    }
  }, [selectedModel]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = inputType === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      
    if (!validTypes.includes(file.type)) {
      alert(`请上传有效的${inputType === 'image' ? '图片' : '音频'}文件`);
      return;
    }
    
    setInputFile(file);
  };


  const handleGenerate = async () => {
    if (!apiConfig) return;
    
    if (!selectedModel) {
      alert('请先选择视频模型');
      return;
    }
    
    // 验证输入
    if (inputType === 'text' && !prompt.trim()) {
      alert('请输入视频描述');
      return;
    }
    
    if ((inputType === 'image' || inputType === 'speech') && !inputFile) {
      alert(`请上传${inputType === 'image' ? '图片' : '音频'}文件`);
      return;
    }

    // 开始生成视频
    await performVideoGeneration();
  };

  const performVideoGeneration = async () => {
    if (!selectedModel || !apiConfig) return;

    setIsGenerating(true);

    try {
      // 检查是否需要配置
      if (needsConfiguration(selectedModel)) {
        setShowConfigHelp(true);
        setIsGenerating(false);
        return;
      }

      const client = createApiClient(apiConfig);
      const modelId = selectedModel.toLowerCase();
      
      // 检查是否为MaaS-HL视频模型，使用专门的API
      if (modelId.includes('maas_hl_video') || modelId.includes('hl_video')) {
        console.log('Using MaaS-HL API for:', selectedModel);
        
        // 使用统一配置的HL端点路径
        const hlEndpointPath = apiConfig.hlEndpointPath;
        console.log(`Using unified HL endpoint:`, hlEndpointPath);
        
        // 构建请求数据
        let requestData: any = {
          model: selectedModel,
        };

        if (inputType === 'text' && prompt.trim()) {
          requestData.prompt = prompt;
        }
        
        if (inputType === 'image' && inputFile) {
          const base64 = await convertToBase64(inputFile);
          requestData.image = base64;
          if (prompt.trim()) {
            requestData.prompt = prompt;
          }
        }
        
        if (inputType === 'speech' && inputFile) {
          const base64 = await convertToBase64(inputFile);
          requestData.audio = base64;
          if (prompt.trim()) {
            requestData.prompt = prompt;
          }
        }

        // 创建headers对象
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'X-API-Endpoint': apiConfig.endpoint
        };
        
        // 只有当hlEndpointPath存在时才添加到headers
        if (hlEndpointPath) {
          headers['X-HL-Endpoint-Path'] = hlEndpointPath;
        }
        
        const response = await fetch('/api/videos/hl', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HL请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('MaaS-HL response:', data);
        
        if (data.data && data.data.length > 0) {
          const videoData = data.data[0];
          const generatedVideo: GeneratedVideo = {
            id: generateId(),
            url: videoData.url,
            prompt: prompt || `${inputType}生成视频`,
            model: selectedModel,
            createdAt: new Date(),
            inputType,
            inputFile: inputFile || undefined,
          };
          
          addGeneratedVideo(generatedVideo);
          setPrompt('');
          setInputFile(null);
          return;
        }
      } else if (modelId.includes('maas_kl_') || modelId.includes('kl_') || modelId.includes('keling')) {
        console.log('Using MaaS-KL API for:', selectedModel);
        
        // 使用用户配置的专用endpoint
        const klEndpointPath = apiConfig.klEndpointPath;
        console.log(`Using unified KL endpoint for all KL models:`, klEndpointPath);
        
        // 构建请求数据
        let requestData: any = {
          model_name: 'kling-v1', // KeLing API 使用固定的模型名
        };

        if (inputType === 'text' && prompt.trim()) {
          requestData.prompt = prompt;
        }
        
        if (inputType === 'image' && inputFile) {
          const base64 = await convertToBase64(inputFile);
          requestData.image = base64;
          if (prompt.trim()) {
            requestData.prompt = prompt;
          }
        }

        // 创建headers对象
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'X-API-Endpoint': apiConfig.endpoint
        };
        
        // 只有当klEndpointPath存在时才添加到headers
        if (klEndpointPath) {
          headers['X-KL-Endpoint-Path'] = klEndpointPath;
        }
        
        const response = await fetch('/api/videos/kl', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `KL请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('MaaS-KL response:', data);
        console.log('MaaS-KL response data structure:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.length > 0) {
          const videoData = data.data[0];
          console.log('KL videoData:', videoData);
          const generatedVideo: GeneratedVideo = {
            id: generateId(),
            url: videoData.url,
            prompt: prompt || `${inputType}生成视频`,
            model: selectedModel,
            createdAt: new Date(),
            inputType,
            inputFile: inputFile || undefined,
          };
          
          console.log('KL generatedVideo object:', generatedVideo);
          addGeneratedVideo(generatedVideo);
          setPrompt('');
          setInputFile(null);
          return;
        } else {
          console.error('KL API response missing data or empty data array:', data);
          throw new Error('KL API响应格式错误：缺少视频数据');
        }
      } else {
        // 普通视频模型处理（原有逻辑）
        // 构建请求数据
        let request: any = {
          model: selectedModel,
        };

        if (inputType === 'text') {
          request.prompt = prompt;
        } else if (inputType === 'image') {
          // 将图片转换为base64
          const base64 = await convertToBase64(inputFile!);
          request.image = base64;
          if (prompt.trim()) {
            request.prompt = prompt; // 图片+文本描述
          }
        } else if (inputType === 'speech') {
          // 将音频转换为base64
          const base64 = await convertToBase64(inputFile!);
          request.audio = base64;
        }

        console.log('Sending video generation request:', request);
        
        // 这里需要根据实际API接口调整
        const response = await fetch('/api/videos/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'X-API-Endpoint': apiConfig.endpoint,
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error(`生成失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Video generation response:', data);

        if (data.data && data.data.length > 0) {
          const videoData = data.data[0];
          let videoUrl: string;
          
          // 处理不同的响应格式
          if (videoData.url) {
            videoUrl = videoData.url;
          } else if (videoData.b64_json) {
            videoUrl = `data:video/mp4;base64,${videoData.b64_json}`;
          } else {
            throw new Error('无效的视频响应格式');
          }
          
          const generatedVideo: GeneratedVideo = {
            id: generateId(),
            url: videoUrl,
            prompt: prompt || `${inputType}生成视频`,
            model: selectedModel,
            createdAt: new Date(),
            inputType,
            inputFile: inputFile || undefined,
          };
          
          addGeneratedVideo(generatedVideo);
          setPrompt('');
          setInputFile(null);
        }
      }
    } catch (error) {
      console.error('Video generation error:', error);
      alert(`生成视频失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 确保返回正确的base64格式
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadVideo = async (url: string, filename: string) => {
    try {
      let blob: Blob;
      
      if (url.startsWith('data:')) {
        const response = await fetch(url);
        blob = await response.blob();
      } else {
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
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">视频模型:</label>
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
                  disabled={isGenerating || categorizedModels.video.length === 0}
                >
                  {categorizedModels.video.length === 0 ? (
                    <option value="">无可用模型</option>
                  ) : (
                    categorizedModels.video.map(model => {
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
                    selectedModel && (selectedModel.toLowerCase().includes('hl_video') || selectedModel.toLowerCase().includes('maas_hl_video'))
                      ? 'bg-blue-100 text-blue-700'
                      : selectedModel && isKLModel(selectedModel)
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedModel && (selectedModel.toLowerCase().includes('hl_video') ||
                                     selectedModel.toLowerCase().includes('maas_hl_video')) ? 'HL模型' :
                     selectedModel && isKLModel(selectedModel) ? (
                       apiConfig?.klEndpointPath ? (
                         apiConfig.klEndpointPath.includes('alhWUjkMbVNjpfNF') ? 'KL V1.6' :
                         apiConfig.klEndpointPath.includes('ktSHZuyRgirDspgK') ? 'KL V2.1' : 'KL模型'
                       ) : 'KL模型'
                     ) : '标准模型'}
                  </span>
                  
                  {/* 配置状态指示器 */}
                  {selectedModel && (selectedModel.toLowerCase().includes('hl_video') ||
                                   selectedModel.toLowerCase().includes('maas_hl_video') ||
                                   selectedModel.toLowerCase().includes('kl_') ||
                                   selectedModel.toLowerCase().includes('maas_kl_') ||
                                   selectedModel.toLowerCase().includes('keling')) && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        !needsConfiguration(selectedModel)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {!needsConfiguration(selectedModel) ? '✓ 已配置' : '⚠ 需配置'}
                      </span>

                      {needsConfiguration(selectedModel) && (
                        <button
                          onClick={() => setShowConfigHelp(true)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="配置视频生成端点"
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


          {/* 输入类型指示 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium text-gray-700">输入类型:</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                {inputType === 'text' && '文本生视频 (T2V)'}
                {inputType === 'image' && '图片生视频 (I2V)'}
                {inputType === 'speech' && '语音生视频 (S2V)'}
              </span>
              {selectedModel && !isModelAvailable(selectedModel) && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                  ⚠️ 该模型暂不可用
                </span>
              )}
            </div>
          </div>

          {/* 文件上传区域 */}
          {(inputType === 'image' || inputType === 'speech') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                上传{inputType === 'image' ? '图片' : '音频'}:
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 hover:border-blue-400 transition-colors">
                {inputFile ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-green-600 font-medium">✓</span>
                      <span className="text-sm text-green-600 truncate">{inputFile.name}</span>
                    </div>
                    <button
                      onClick={() => setInputFile(null)}
                      className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors flex-shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 py-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <span className="text-sm text-gray-500 block">
                        点击上传{inputType === 'image' ? '图片' : '音频'}文件
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {inputType === 'image' ? '支持 JPG, PNG, GIF, WebP' : '支持 MP3, WAV, M4A, OGG'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept={inputType === 'image' ? 'image/*' : 'audio/*'}
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* 文本描述输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {inputType === 'text' ? '视频描述:' : '补充描述 (可选):'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  inputType === 'text' 
                    ? "描述你想要生成的视频..." 
                    : "对视频内容的补充描述..."
                }
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                rows={3}
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating || 
                  !selectedModel ||
                  !isModelAvailable(selectedModel) || 
                  (!prompt.trim() && inputType === 'text') || 
                  ((inputType === 'image' || inputType === 'speech') && !inputFile)
                }
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
      </div>

      {/* 视频展示区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
        {generatedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <VideoIcon className="w-16 h-16 sm:w-20 sm:h-20 mb-4 opacity-50" />
            <p className="text-lg sm:text-xl font-medium mb-2">还没有生成任何视频</p>
            <p className="text-sm sm:text-base text-center">选择模型并输入内容开始创作</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {generatedVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative">
                  <video
                    src={video.url}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {video.prompt}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{video.model}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        {video.inputType === 'text' && 'T2V'}
                        {video.inputType === 'image' && 'I2V'}
                        {video.inputType === 'speech' && 'S2V'}
                      </span>
                    </div>
                    <span className="whitespace-nowrap">{video.createdAt.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => downloadVideo(video.url, `${video.id}.mp4`)}
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
              <h3 className="text-lg font-semibold text-orange-700">⚠ 需要配置视频生成端点</h3>
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
                  🎬 <strong>视频生成需要配置专用端点</strong>
                </p>
                <p className="text-xs text-blue-600 mb-3">
                  为了使用视频生成功能，需要先在统一配置管理中设置相应的端点路径。
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>配置步骤：</strong></p>
                  <p>1. 点击页面左上角的设置按钮</p>
                  <p>2. 选择"视频生成"标签页</p>
                  <p>3. 填写对应的端点路径（HL或KL）</p>
                  <p>4. 保存配置后即可使用视频生成</p>
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