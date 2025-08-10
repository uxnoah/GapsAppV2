/**
 * DIAGRAM TITLE UPDATE API TESTS
 * ==============================
 * Tests for the new API endpoint that allows updating diagram titles.
 * This follows the TDD approach: tests first, then implementation.
 */

import { NextRequest } from 'next/server'
import { PUT } from '../api/diagram/title/route'

describe('Diagram Title Update API', () => {
  const mockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/diagram/title', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  describe('PUT /api/diagram/title', () => {
    it('should update diagram title successfully', async () => {
      const request = mockRequest({ title: 'New Diagram Title' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Diagram title updated successfully')
      expect(data.diagram.title).toBe('New Diagram Title')
    })

    it('should return 400 for missing title', async () => {
      const request = mockRequest({})
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title is required')
    })

    it('should return 400 for empty title', async () => {
      const request = mockRequest({ title: '' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title cannot be empty')
    })

    it('should return 400 for title with only whitespace', async () => {
      const request = mockRequest({ title: '   ' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title cannot be empty')
    })

    it('should trim whitespace from title', async () => {
      const request = mockRequest({ title: '  Trimmed Title  ' })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.diagram.title).toBe('Trimmed Title')
    })
  })
})
