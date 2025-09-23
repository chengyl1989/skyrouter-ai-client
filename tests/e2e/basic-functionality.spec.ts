import { test, expect } from '@playwright/test'

test.describe('Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/小宿AI助手/)
    await expect(page.getByText('小宿AI助手')).toBeVisible()
  })

  test('should show API configuration modal on first visit', async ({ page }) => {
    // Check if API config modal appears
    await expect(page.getByText('API 配置')).toBeVisible()
    await expect(page.getByPlaceholderText('https://genaiapi.cloudsway.net')).toBeVisible()
  })

  test('should switch between tabs', async ({ page }) => {
    // Close API config modal first
    await page.getByText('取消').click()
    
    // Test tab switching
    await page.getByText('搜索').click()
    await expect(page.getByText('搜索模型:')).toBeVisible()
    
    await page.getByText('生图').click()
    await expect(page.getByText('图像模型:')).toBeVisible()
    
    await page.getByText('视频').click()
    await expect(page.getByText('视频模型:')).toBeVisible()
    
    await page.getByText('聊天').click()
    await expect(page.getByText('聊天模型:')).toBeVisible()
  })

  test('should configure API settings', async ({ page }) => {
    // Fill API configuration
    await page.getByPlaceholderText('https://genaiapi.cloudsway.net').fill('https://test-api.com')
    await page.getByPlaceholderText('输入您的 API Key').fill('test-api-key')
    await page.getByText('保存').click()
    
    // Check if configuration is saved
    await expect(page.getByText('已连接')).toBeVisible()
    await expect(page.getByText('https://test-api.com')).toBeVisible()
  })

  test('should show proper responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Close API config modal
    await page.getByText('取消').click()
    
    // Check mobile navigation
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    
    // Test mobile tab switching
    await page.getByText('搜索').first().click()
    await expect(page.getByText('搜索模型:')).toBeVisible()
  })
})

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Configure API
    await page.getByPlaceholderText('https://genaiapi.cloudsway.net').fill('https://test-api.com')
    await page.getByPlaceholderText('输入您的 API Key').fill('test-api-key')
    await page.getByText('保存').click()
  })

  test('should disable send button when message is empty', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /发送/i })
    await expect(sendButton).toBeDisabled()
  })

  test('should enable send button when message is filled', async ({ page }) => {
    await page.getByPlaceholderText('输入消息...').fill('Hello')
    const sendButton = page.getByRole('button', { name: /发送/i })
    await expect(sendButton).toBeEnabled()
  })
})

test.describe('Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Configure API
    await page.getByPlaceholderText('https://genaiapi.cloudsway.net').fill('https://test-api.com')
    await page.getByPlaceholderText('输入您的 API Key').fill('test-api-key')
    await page.getByText('保存').click()
    
    // Switch to image tab
    await page.getByText('生图').click()
  })

  test('should show image generation interface', async ({ page }) => {
    await expect(page.getByText('图像模型:')).toBeVisible()
    await expect(page.getByPlaceholderText('描述你想要生成的图片...')).toBeVisible()
  })

  test('should disable generate button when prompt is empty', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /生成/i })
    await expect(generateButton).toBeDisabled()
  })

  test('should show configuration button for MJ models', async ({ page }) => {
    // Assuming MJ model is available in the list
    await page.selectOption('select', { label: /MJ/i })
    await expect(page.getByTitle('配置图像生成端点')).toBeVisible()
  })
})