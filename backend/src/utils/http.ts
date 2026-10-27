export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  error?: unknown
}

export function ok<T>(data: T, message = 'OK'): ApiResponse<T> {
  return { success: true, message, data }
}

export function fail(message = 'Error', error?: unknown): ApiResponse {
  return { success: false, message, error }
}
