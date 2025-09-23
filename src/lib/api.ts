import axios from 'axios';
import { ApiConfig, ChatRequest, ChatResponse, ImageRequest, ImageResponse } from '@/types';

export class SkyRouterAPI {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Endpoint': this.config.endpoint,
    };
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post(
      '/api/chat/completions',
      request,
      { headers: this.headers }
    );
    return response.data;
  }

  async streamChatCompletion(request: ChatRequest): Promise<ReadableStream> {
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.body!;
  }

  async generateImage(request: ImageRequest): Promise<ImageResponse> {
    try {
      console.log('Making image generation request to proxy:', '/api/images/generations');
      console.log('Request payload:', request);
      
      const response = await axios.post(
        '/api/images/generations',
        request,
        { 
          headers: this.headers,
          timeout: 120000 // 2分钟超时
        }
      );
      
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('Image generation API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // Check if we have enhanced error data from our API
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
          // Pass through the enhanced error information
          if (errorData.type) {
            // Create a structured error message that includes the error data
            const structuredError = new Error(JSON.stringify(errorData));
            structuredError.name = errorData.type;
            throw structuredError;
          } else if (errorData.error || errorData.message) {
            // Legacy error format
            throw new Error(errorData.error || errorData.message);
          }
        }
        
        // Fallback error handling
        throw new Error(`API请求失败 (${error.response?.status}): ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  async getModels() {
    try {
      console.log('Fetching models from proxy:', '/api/models');
      
      const response = await axios.get('/api/models', { 
        headers: this.headers,
        timeout: 30000 // 30秒超时
      });
      
      console.log('Models response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get models error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`获取模型列表失败 (${error.response?.status}): ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async getHLEndpoints() {
    try {
      console.log('Fetching HL endpoints from proxy:', '/api/hl-endpoints');
      
      const response = await axios.get('/api/hl-endpoints', { 
        headers: this.headers,
        timeout: 10000 // 10秒超时
      });
      
      console.log('HL endpoints response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get HL endpoints error:', error);
      if (axios.isAxiosError(error)) {
        console.warn('Failed to auto-detect HL endpoints, using fallback');
        // 返回fallback数据而不是抛出错误
        return {
          availableEndpoints: [{
            path: 'UfRLJwuMWPdfKWQg',
            status: 'fallback',
            note: 'Default recommended endpoint'
          }],
          recommended: 'UfRLJwuMWPdfKWQg'
        };
      }
      throw error;
    }
  }
}

export function createApiClient(config: ApiConfig) {
  return new SkyRouterAPI(config);
}