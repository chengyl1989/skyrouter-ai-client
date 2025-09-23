import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AppState, ApiConfig, Conversation, ChatMessage, GeneratedImage, GeneratedVideo, SearchResult } from '@/types';

interface StoreState extends AppState {
  // Actions
  setApiConfig: (config: ApiConfig) => void;
  setCurrentTab: (tab: 'chat' | 'image' | 'video' | 'search') => void;
  addConversation: (conversation: Conversation) => void;
  setCurrentConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  addGeneratedVideo: (video: GeneratedVideo) => void;
  addSearchResult: (result: SearchResult) => void;
  clearSearchResults: () => void;
  clearConversations: () => void;
  deleteConversation: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      apiConfig: null,
      currentTab: 'chat',
      conversations: [],
      currentConversation: null,
      generatedImages: [],
      generatedVideos: [],
      searchResults: [],

      // Actions
      setApiConfig: (config) => set({ apiConfig: config }),
      
      setCurrentTab: (tab) => set({ currentTab: tab }),
      
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation.id,
      })),
      
      setCurrentConversation: (id) => set({ currentConversation: id }),
      
      addMessage: (conversationId, message) => set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, message] }
            : conv
        ),
      })),
      
      updateMessage: (conversationId, messageId, content) => set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, content } : msg
                ),
              }
            : conv
        ),
      })),
      
      addGeneratedImage: (image) => set((state) => ({
        generatedImages: [image, ...state.generatedImages],
      })),
      
      addGeneratedVideo: (video) => set((state) => ({
        generatedVideos: [video, ...state.generatedVideos],
      })),
      
      addSearchResult: (result) => set((state) => ({
        searchResults: [result, ...state.searchResults],
      })),
      
      clearSearchResults: () => set({
        searchResults: [],
      }),
      
      clearConversations: () => set({
        conversations: [],
        currentConversation: null,
      }),
      
      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
        currentConversation: state.currentConversation === id ? null : state.currentConversation,
      })),
    }),
    {
      name: 'skyrouter-ai-storage',
      partialize: (state) => ({
        apiConfig: state.apiConfig,
        conversations: state.conversations,
        generatedImages: state.generatedImages,
        generatedVideos: state.generatedVideos,
        searchResults: state.searchResults,
      }),
      // 恢复数据时转换日期字段
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 转换对话中的日期字段
          state.conversations = state.conversations.map(conv => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            messages: conv.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          
          // 转换生成图片中的日期字段
          state.generatedImages = state.generatedImages.map(img => ({
            ...img,
            createdAt: new Date(img.createdAt)
          }));
          
          // 转换生成视频中的日期字段
          state.generatedVideos = state.generatedVideos?.map(video => ({
            ...video,
            createdAt: new Date(video.createdAt)
          })) || [];
          
          // 转换搜索结果中的日期字段
          state.searchResults = state.searchResults?.map(result => ({
            ...result,
            timestamp: new Date(result.timestamp)
          })) || [];
        }
      }
    }
  )
);