import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Wraps an async Express route handler so that any rejected promise is
 * forwarded to next(err), allowing the global errorHandler to respond.
 *
 * Express 4.x does not do this automatically. Without this wrapper, an
 * unhandled rejection inside an async controller produces no HTTP response
 * (the request hangs) and emits an UnhandledPromiseRejectionWarning.
 */
export function asyncWrap(
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
