import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const secret = env.JWT_SECRET || 'change-me-in-dev'

export type TokenPayload = {
  userId: string
  email: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload
  } catch {
    return null
  }
}
