import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { HttpError } from './errorHandler.js'

export type AuthRequest = Request & {
  user?: {
    userId: string
    email: string
  }
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new HttpError(401, 'Unauthorized')
  }
  const payload = verifyToken(token)
  if (!payload) {
    throw new HttpError(401, 'Unauthorized')
  }
  req.user = payload
  next()
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      req.user = payload
    }
  }
  next()
}
