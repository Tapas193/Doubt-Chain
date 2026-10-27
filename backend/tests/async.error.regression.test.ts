import request from 'supertest'
import { vi } from 'vitest'
import app from '../src/app'
import * as authService from '../src/services/auth.service'

/**
 * Regression test for BUG-1: async controller errors must be forwarded to
 * the Express error handler via asyncWrap.
 *
 * Without asyncWrap, a thrown error inside an async controller is an
 * unhandled promise rejection — Express 4.x never calls next(err) so the
 * request hangs indefinitely and the process emits a warning.
 *
 * With asyncWrap in place, the error handler returns a structured 500 JSON
 * response within the request's normal lifetime.
 */
describe('Async error handling (BUG-1 regression)', () => {
  it('returns 500 JSON when a controller throws unexpectedly — not a hang', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue(
      new Error('Simulated unexpected DB failure')
    )

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/internal server error/i)

    vi.restoreAllMocks()
  })

  it('returns 409 JSON when login service throws HttpError (auth conflict)', async () => {
    const { HttpError } = await import('../src/middleware/errorHandler.js')
    vi.spyOn(authService, 'loginUser').mockRejectedValue(
      new HttpError(409, 'User already exists')
    )

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User already exists')

    vi.restoreAllMocks()
  })
})
