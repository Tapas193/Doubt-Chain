import { ApiResponse } from '../types/api'

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>

  if (!res.ok || data.success === false) {
    const message = data.message || `Request failed with status ${res.status}`
    const error: any = new Error(message)
    error.status = res.status
    error.details = data.error
    throw error
  }

  return data.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
}
