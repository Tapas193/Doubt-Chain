import { NextFunction, Request, Response } from 'express'
import { fail } from '../utils/http.js'

export class HttpError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = 'HttpError'
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json(fail(err.message))
  }

  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; meta?: Record<string, unknown>; message?: string }
    if (prismaErr.code === 'P2002') {
      const target = Array.isArray(prismaErr.meta?.target) ? prismaErr.meta?.target.join(', ') : 'field'
      return res.status(409).json(fail(`Unique constraint violation: ${target} already exists`))
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json(fail('Record not found'))
    }
    if (prismaErr.code === 'P2003') {
      return res.status(400).json(fail('Foreign key constraint violation'))
    }
  }

  console.error('[API Error]', err)

  if (err instanceof Error) {
    return res.status(500).json(fail('Internal server error', err.message))
  }
  return res.status(500).json(fail('Internal server error'))
}
