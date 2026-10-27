import request from 'supertest'
import app from '../src/app'

describe('Doubts search validation', () => {
  it('rejects search without query', async () => {
    const res = await request(app).get('/api/v1/doubts/search')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
