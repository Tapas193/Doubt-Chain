import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { HttpError } from './errorHandler.js'
import { prisma } from '../config/prisma.js'

export type AuthUser = {
  userId: string
  email: string
  role?: string
  profession?: string
}

export type AuthRequest = Request & {
  user?: AuthUser
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

export async function requireFacultyOrAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new HttpError(401, 'Unauthorized')
  }
  const payload = verifyToken(token)
  if (!payload) {
    throw new HttpError(401, 'Unauthorized')
  }
  req.user = payload

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, profession: true, role: true, email: true }
  })

  if (!user) {
    throw new HttpError(401, 'User not found')
  }

  const isFaculty = user.profession === 'PROFESSOR' || user.role === 'FACULTY'
  const isAdmin = user.role === 'ADMIN' || user.email.toLowerCase().includes('admin@')

  if (!isFaculty && !isAdmin) {
    throw new HttpError(403, 'Forbidden: Student access restricted from institutional analytics')
  }

  req.user.profession = user.profession || undefined
  req.user.role = isAdmin ? 'ADMIN' : 'FACULTY'
  next()
}
