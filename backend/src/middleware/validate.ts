import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { fail } from '../utils/http.js'

export function validate(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Try wrapped style first (body/query/params)
      const wrapped = {
        body: req.body,
        query: req.query,
        params: req.params
      }
      const result = schema.safeParse ? schema.safeParse(wrapped) : null
      if (result && result.success) {
        const r: any = result.data
        if (r.body !== undefined) req.body = r.body
        if (r.query !== undefined) req.query = r.query
        if (r.params !== undefined) req.params = r.params
        return next()
      }
      // Fallback: try parsing body directly
      if (schema.safeParse) {
        const bodyResult = schema.safeParse(req.body)
        if (bodyResult.success) {
          req.body = bodyResult.data
          return next()
        }
        // If both fail, prefer wrapped error if exists
        if (result && !result.success) {
          throw result.error
        }
        throw bodyResult.error
      }
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(fail('Validation failed', err.flatten()))
      }
      next(err)
    }
  }
}
