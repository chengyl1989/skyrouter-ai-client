/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/chat/completions/route'

describe('/api/chat/completions', () => {
  it('should handle POST request with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key',
        'X-API-Endpoint': 'https://test-api.com'
      },
      body: {
        model: 'test-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    })

    // Mock fetch for the external API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?'
            }
          }
        ]
      })
    }) as jest.Mock

    const response = await handler.POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.choices[0].message.content).toBe('Hello! How can I help you?')
  })

  it('should return 400 for missing authorization', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        model: 'test-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }
    })

    const response = await handler.POST(req as any)
    
    expect(response.status).toBe(400)
  })

  it('should return 400 for invalid request body', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key',
        'X-API-Endpoint': 'https://test-api.com'
      },
      body: {
        // Missing required fields
      }
    })

    const response = await handler.POST(req as any)
    
    expect(response.status).toBe(400)
  })
})