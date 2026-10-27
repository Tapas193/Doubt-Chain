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
  if (err instanceof Error) {
    return res.status(500).json(fail('Internal server error', err.message))
  }
  return res.status(500).json(fail('Internal server error'))
}
