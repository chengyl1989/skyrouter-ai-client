import { act, renderHook } from '@testing-library/react'
import { useStore } from '@/store/useStore'

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStore())
    act(() => {
      result.current.setApiConfig(null)
      result.current.clearConversations()
      result.current.clearSearchResults()
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useStore())
    
    expect(result.current.apiConfig).toBeNull()
    expect(result.current.currentTab).toBe('chat')
    expect(result.current.conversations).toEqual([])
    expect(result.current.currentConversation).toBeNull()
    expect(result.current.generatedImages).toEqual([])
    expect(result.current.searchResults).toEqual([])
  })

  it('sets and updates API config', () => {
    const { result } = renderHook(() => useStore())
    
    const newConfig = {
      endpoint: 'https://test-api.com',
      apiKey: 'test-key'
    }

    act(() => {
      result.current.setApiConfig(newConfig)
    })

    expect(result.current.apiConfig).toEqual(newConfig)
  })

  it('changes current tab', () => {
    const { result } = renderHook(() => useStore())
    
    act(() => {
      result.current.setCurrentTab('image')
    })

    expect(result.current.currentTab).toBe('image')
  })

  it('adds and manages conversations', () => {
    const { result } = renderHook(() => useStore())
    
    const testMessage = {
      id: '1',
      role: 'user' as const,
      content: 'Test message',
      timestamp: new Date()
    }

    act(() => {
      result.current.addMessage(testMessage)
    })

    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.conversations[0].messages).toContain(testMessage)
  })

  it('deletes conversations', () => {
    const { result } = renderHook(() => useStore())
    
    // Add a conversation first
    const testMessage = {
      id: '1',
      role: 'user' as const,
      content: 'Test message',
      timestamp: new Date()
    }

    act(() => {
      result.current.addMessage(testMessage)
    })

    const conversationId = result.current.conversations[0].id

    act(() => {
      result.current.deleteConversation(conversationId)
    })

    expect(result.current.conversations).toHaveLength(0)
  })

  it('adds generated images', () => {
    const { result } = renderHook(() => useStore())
    
    const testImage = {
      id: '1',
      url: 'https://example.com/image.jpg',
      prompt: 'Test image',
      model: 'test-model',
      createdAt: new Date()
    }

    act(() => {
      result.current.addGeneratedImage(testImage)
    })

    expect(result.current.generatedImages).toContain(testImage)
  })

  it('adds search results', () => {
    const { result } = renderHook(() => useStore())
    
    const testResult = {
      id: '1',
      query: 'test query',
      content: 'test content',
      model: 'SmartSearch',
      timestamp: new Date(),
      results: []
    }

    act(() => {
      result.current.addSearchResult(testResult)
    })

    expect(result.current.searchResults).toContain(testResult)
  })

  it('clears all data', () => {
    const { result } = renderHook(() => useStore())
    
    // Add some data first
    act(() => {
      result.current.addMessage({
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: new Date()
      })
      result.current.addSearchResult({
        id: '1',
        query: 'test',
        content: 'test',
        model: 'SmartSearch',
        timestamp: new Date()
      })
    })

    // Clear all data
    act(() => {
      result.current.clearConversations()
      result.current.clearSearchResults()
    })

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.searchResults).toHaveLength(0)
  })
})