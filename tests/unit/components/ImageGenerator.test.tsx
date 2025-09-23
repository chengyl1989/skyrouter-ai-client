import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageGenerator } from '@/components/ImageGenerator'
import { useStore } from '@/store/useStore'
import { useModels } from '@/hooks/useModels'

// Mock dependencies
jest.mock('@/store/useStore')
jest.mock('@/hooks/useModels')
jest.mock('@/lib/api')

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>
const mockUseModels = useModels as jest.MockedFunction<typeof useModels>

describe('ImageGenerator', () => {
  const mockApiConfig = {
    endpoint: 'https://test-api.com',
    apiKey: 'test-key',
    mjModelEndpoints: {
      'MaaS-MJ': 'v1/ai/test-endpoint'
    }
  }

  const mockModels = {
    categorizedModels: {
      image: [
        { id: 'MaaS Dall-E-3', created: '2023-01-01', object: 'model', owned_by: 'test' },
        { id: 'MaaS-MJ', created: '2023-01-01', object: 'model', owned_by: 'test' }
      ],
      chat: [],
      other: []
    },
    loading: false,
    error: null,
    refresh: jest.fn()
  }

  beforeEach(() => {
    mockUseStore.mockReturnValue({
      apiConfig: mockApiConfig,
      generatedImages: [],
      addGeneratedImage: jest.fn(),
      setApiConfig: jest.fn(),
    } as any)

    mockUseModels.mockReturnValue(mockModels as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ImageGenerator />)
    expect(screen.getByText('图像模型:')).toBeInTheDocument()
  })

  it('shows configuration needed status for MJ models', () => {
    mockUseStore.mockReturnValue({
      apiConfig: { ...mockApiConfig, mjModelEndpoints: {} },
      generatedImages: [],
      addGeneratedImage: jest.fn(),
      setApiConfig: jest.fn(),
    } as any)

    render(<ImageGenerator />)
    expect(screen.getByText('需配置')).toBeInTheDocument()
  })

  it('shows configured status for MJ models with endpoint', () => {
    render(<ImageGenerator />)
    expect(screen.getByText('已配置')).toBeInTheDocument()
  })

  it('opens configuration modal when clicking settings button', () => {
    render(<ImageGenerator />)
    
    const settingsButton = screen.getByTitle('配置图像生成端点')
    fireEvent.click(settingsButton)
    
    expect(screen.getByText('配置图像生成端点')).toBeInTheDocument()
  })

  it('disables generate button when prompt is empty', () => {
    render(<ImageGenerator />)
    
    const generateButton = screen.getByRole('button', { name: /生成/i })
    expect(generateButton).toBeDisabled()
  })

  it('enables generate button when prompt is filled and model is available', () => {
    render(<ImageGenerator />)
    
    const textarea = screen.getByPlaceholderText('描述你想要生成的图片...')
    fireEvent.change(textarea, { target: { value: 'A beautiful sunset' } })
    
    const generateButton = screen.getByRole('button', { name: /生成/i })
    expect(generateButton).not.toBeDisabled()
  })

  it('shows no API config message when apiConfig is null', () => {
    mockUseStore.mockReturnValue({
      apiConfig: null,
      generatedImages: [],
      addGeneratedImage: jest.fn(),
      setApiConfig: jest.fn(),
    } as any)

    render(<ImageGenerator />)
    expect(screen.getByText('请先配置 API 设置')).toBeInTheDocument()
  })

  it('displays generated images when available', () => {
    const mockImages = [
      {
        id: '1',
        url: 'https://example.com/image1.jpg',
        prompt: 'Test image 1',
        model: 'MaaS Dall-E-3',
        createdAt: new Date('2023-01-01')
      }
    ]

    mockUseStore.mockReturnValue({
      apiConfig: mockApiConfig,
      generatedImages: mockImages,
      addGeneratedImage: jest.fn(),
      setApiConfig: jest.fn(),
    } as any)

    render(<ImageGenerator />)
    expect(screen.getByAltText('Test image 1')).toBeInTheDocument()
    expect(screen.getByText('Test image 1')).toBeInTheDocument()
  })
})