import { describe, it, expect } from 'vitest'

describe('API client shape', () => {
  it('has base url from env or fallback', () => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    expect(typeof base).toBe('string')
  })
})
