// API 配置
export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  mjEndpointPath?: string; // MaaS-MJ 的 endpointPath
  hlEndpointPath?: string; // MaaS-HL 的 endpointPath (默认)
  klEndpointPath?: string; // MaaS-KL 的统一 endpointPath (所有KL模型共享)
  // 每个HL视频模型的专用endpoint映射
  hlModelEndpoints?: Record<string, string>;
  // 每个MJ图像模型的专用endpoint映射
  mjModelEndpoints?: Record<string, string>;
  // 统一的搜索endpoint配置 (智能搜索和全文搜索共用)
  searchEndpointId?: string;
  // Bing搜索API密钥
  bingSearchKey?: string;
}

// 模型信息
export interface ModelInfo {
  id: string;
  created: string;
  object: string;
  owned_by: string;
}

// 模型列表响应
export interface ModelListResponse {
  data: ModelInfo[];
  object: string;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 聊天会话
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  model?: string;
}

// 聊天请求
export interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

// 聊天响应
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 图片生成请求
export interface ImageRequest {
  prompt: string;
  model: string;
  size?: string;
  quality?: string;
  n?: number;
}

// 图片生成响应
export interface ImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

// 生成的图片
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: Date;
}

// 视频生成请求
export interface VideoRequest {
  model: string;
  prompt?: string;
  image?: string;
  audio?: string;
}

// 视频生成响应
export interface VideoResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

// 生成的视频
export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: Date;
  inputType: 'text' | 'image' | 'speech';
  inputFile?: File;
}

// 搜索结果
export interface SearchResult {
  id: string;
  query: string;
  content: string;
  model: string;
  timestamp: Date;
  results?: any[];
}

// 应用状态
export interface AppState {
  apiConfig: ApiConfig | null;
  currentTab: 'chat' | 'image' | 'video' | 'search';
  conversations: Conversation[];
  currentConversation: string | null;
  generatedImages: GeneratedImage[];
  generatedVideos: GeneratedVideo[];
  searchResults: SearchResult[];
}