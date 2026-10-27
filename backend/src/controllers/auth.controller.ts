import { Request, Response } from 'express'
import { registerUser, loginUser, getCurrentUser } from '../services/auth.service.js'
import { signToken } from '../utils/jwt.js'
import { ok } from '../utils/http.js'
import { AuthRequest } from '../middleware/auth.js'
import { env } from '../config/env.js'

const isProd = env.NODE_ENV === 'production'

export async function register(req: Request, res: Response) {
  const { confirmPassword, ...payload } = req.body
  const user = await registerUser(payload)
  const token = signToken({ userId: user.id, email: user.email })
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
  res.status(201).json(ok(user, 'Registered'))
}

export async function login(req: Request, res: Response) {
  const user = await loginUser(req.body)
  const token = signToken({ userId: user.id, email: user.email })
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
  res.json(ok(user, 'Logged in'))
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  })
  res.json(ok({ loggedOut: true }, 'Logged out'))
}

export async function me(req: AuthRequest, res: Response) {
  const user = await getCurrentUser(req.user!.userId)
  res.json(ok(user, 'Current user'))
}
