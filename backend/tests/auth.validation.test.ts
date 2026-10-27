import request from 'supertest'
import { vi } from 'vitest'
import app from '../src/app'
import * as authService from '../src/services/auth.service'

describe('Auth validation', () => {
  it('rejects registration with invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Test User',
      profession: 'STUDENT',
      identificationNumber: 'ST123',
      email: 'bad',
      password: '123456',
      confirmPassword: '123456'
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects login with missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects registration when body is missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({})
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBeDefined()
  })

  it('accepts valid registration body shape for validation', async () => {
    vi.spyOn(authService, 'registerUser').mockResolvedValue({
      id: 'test-id',
      email: 'jane.unique.test@example.com',
      username: 'janedoe1234',
      displayName: 'Jane Doe',
      fullName: 'Jane Doe',
      profession: 'STUDENT',
      identificationNumber: 'ID123456',
      createdAt: new Date().toISOString()
    } as any)

    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Jane Doe',
      profession: 'STUDENT',
      identificationNumber: 'ID123456',
      email: 'jane.unique.test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    })
    expect(res.status).not.toBe(400)
    vi.restoreAllMocks()
  })
})
