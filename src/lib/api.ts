/**
 * Centralized API client wrapper
 * ---------------------------------
 * Why this file exists:
 * - Give us ONE place to change how requests work (headers, base URL, timeouts, errors).
 * - Keep components simple and consistent (no repeated fetch boilerplate).
 * - Add strong TypeScript typing for request/response shapes.
 *
 * Glossary (in our app):
 * - fetch: The browser/Node function that sends HTTP requests.
 * - HTTP method: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove).
 * - Endpoint: The URL we call (e.g., "/api/thoughts/123").
 * - Route: The server code that handles a specific endpoint+method (e.g., `src/app/api/thoughts/[id]/route.ts` with `PUT`).
 * - API call: A fetch request to one of our endpoints that returns JSON.
 *
 * Data flow for api.get(...):
 *   Component → api.get(routes.diagram) → apiFetch → fetch → server route → JSON → apiFetch → Component
 *
 * Typical usage:
 *   import { api, routes } from '@/lib/api'
 *   const diagram = await api.get<DiagramApi>(routes.diagram)
 *   const created = await api.post<ThoughtApi>(routes.thoughts, { content })
 *
 * Notes on <T> (generics):
 * - You pass the expected response type, and `apiFetch` returns that type.
 * - Example: `api.get<DiagramApi>(routes.diagram)` means "expect JSON shaped like DiagramApi".
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Optional retry policy for GET requests (disabled unless provided)
export interface RetryOptions {
  maxAttempts?: number
  backoffMs?: number
  strategy?: 'fixed' | 'exponential'
  jitter?: boolean
  retryOn?: (error: unknown, attempt: number) => boolean
}

export type ApiRequestOptions = RequestInit & { retry?: RetryOptions }

/**
 * routes: Canonical paths for our API endpoints.
 * Centralizing here lets us rename/move routes once without hunting through components.
 */
export const routes = {
  /** Load/save full diagram */
  diagram: '/api/diagram',
  /** Update diagram title only */
  diagramTitle: '/api/diagram/title',
  /** Create thought(s); list endpoint for thoughts when needed */
  thoughts: '/api/thoughts',
  /** Edit/delete a single thought by its ID */
  thoughtById: (id: string | number) => `/api/thoughts/${id}`,
  /** Move a single thought (drag-and-drop) */
  thoughtMove: (id: string | number) => `/api/thoughts/${id}/move`,
  /** Dev/test-only: load stats for debug panel */
  stats: '/api/test-database/stats',
} as const

export class ApiError extends Error {
  status: number
  details?: unknown
  /**
   * ApiError: Thrown for any non-OK HTTP response or network/timeout issue.
   * - status: HTTP status (e.g., 400, 404, 500). 0 means network-level error.
   * - details: Parsed JSON body (if any) to help debugging/UI messages.
   */
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

/**
 * Extract a simple, human-friendly message from any unknown error. 
 * Prefer ApiError.message and details.message when available.
 */
export const getApiErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    const detailsMessage = typeof (err.details as any)?.message === 'string' ? (err.details as any).message : undefined
    return detailsMessage || err.message || `Request failed (${err.status || 'unknown'})`
  }
  if (err && typeof err === 'object' && 'message' in (err as any) && typeof (err as any).message === 'string') {
    return (err as any).message
  }
  return 'Unexpected error'
}

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
}

// Base URL for all requests.
// Keep empty for same-origin requests. If we later host the API separately, change it here once.
const baseUrl = ''

/**
 * apiFetch<T>(path, init?): Promise<T>
 * Core request function used by all helpers below.
 * - Adds default JSON headers
 * - Applies a 15s timeout (abort controller)
 * - Parses JSON response when present
 * - Throws ApiError on non-OK responses or network errors
 *
 * Tip: Pass <T> to describe the expected JSON response shape.
 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const apiFetch = async <T>(
  path: string,
  init: ApiRequestOptions = {}
): Promise<T> => {
  const doRequest = async (): Promise<T> => {
    // Timebox every request so UI isn't stuck forever
    const controller = new AbortController()
    const timeoutMs = 15000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      // 1) Build request options (merge defaults + caller-provided init)
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { ...defaultHeaders, ...(init.headers || {}) },
        signal: controller.signal,
      })

      // 2) Try to parse JSON if the server says it's JSON
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json().catch(() => undefined) : undefined

      // 3) Non-OK responses become ApiError with status + details
      if (!response.ok) {
        const message = (data as any)?.message || `Request failed: ${response.status}`
        throw new ApiError(message, response.status, data)
      }

      // 4) Return parsed JSON typed as T
      return data as T
    } catch (error: any) {
      // Handle timeouts and network-level errors uniformly
      if (error?.name === 'AbortError') {
        throw new ApiError('Request timed out', 408)
      }
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(error?.message || 'Network error', 0, error)
    } finally {
      // Always clear the timeout regardless of success/failure
      clearTimeout(timeoutId)
    }
  }

  const method = String((init.method || 'GET')).toUpperCase() as HttpMethod
  const retry = init.retry
  if (method !== 'GET' || !retry) {
    return doRequest()
  }

  const maxAttempts = Math.max(1, retry.maxAttempts ?? 1)
  const base = retry.backoffMs ?? 200
  const strategy = retry.strategy ?? 'exponential'
  const jitter = retry.jitter ?? true
  const shouldRetry = (err: unknown, attempt: number) => {
    if (typeof retry.retryOn === 'function') return retry.retryOn(err, attempt)
    if (err instanceof ApiError) {
      return [0, 408, 429, 500, 502, 503, 504].includes(err.status)
    }
    return true
  }

  let attempt = 1
  try {
    return await doRequest()
  } catch (err) {
    if (!shouldRetry(err, attempt) || maxAttempts === 1) throw err
  }

  while (attempt < maxAttempts) {
    attempt += 1
    const factor = strategy === 'fixed' ? 1 : Math.pow(2, attempt - 2)
    const baseDelay = base * factor
    const jitterFactor = jitter ? 0.75 + Math.random() * 0.5 : 1
    await delay(baseDelay * jitterFactor)
    try {
      return await doRequest()
    } catch (err) {
      if (!shouldRetry(err, attempt) || attempt >= maxAttempts) throw err
    }
  }
  return doRequest()
}

/**
 * Friendly helpers for common HTTP methods.
 * These simply call `apiFetch` with the right method and optional JSON body.
 *
 * Examples:
 *   const d = await api.get<DiagramApi>(routes.diagram)
 *   const t = await api.post<ThoughtApi>(routes.thoughts, { content: 'New' })
 *   const u = await api.put<ThoughtApi>(routes.thoughtById(id), { content: 'Edit' })
 *   const m = await api.patch<ThoughtApi>(routes.thoughtMove(id), { targetSection: 'plan', targetIndex: 0 })
 *   await api.del(routes.thoughtById(id))
 */
export const api = {
  get: async <T>(path: string, init?: ApiRequestOptions) => apiFetch<T>(path, { method: 'GET', ...(init || {}) }),
  post: async <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  put: async <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
  patch: async <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
  del: async <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}


