import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { signToken } from '../src/utils/jwt'

describe('Phase 3 lifecycle route validation', () => {
  it('rejects an accept request that omits answerId before reaching the service', async () => {
    const token = signToken({ userId: 'user-1', email: 'user@example.com' })

    const response = await request(app)
      .post('/api/v1/doubts/doubt-1/accept')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe('Validation failed')
  })
})
