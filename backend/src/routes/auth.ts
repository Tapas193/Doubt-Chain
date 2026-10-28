import { Router } from 'express'
import { register, login, logout, me, updatePreferences } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../validators/auth.js'
import { requireAuth } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'
import { asyncWrap } from '../utils/asyncWrap.js'
import { env } from '../config/env.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' || env.NODE_ENV === 'test' ? 1000 : 20,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  skip: (req) => Boolean(env.NODE_ENV === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('127.0.0.1')))
})

router.post('/register', authLimiter, validate(registerSchema), asyncWrap(register))
router.post('/login', authLimiter, validate(loginSchema), asyncWrap(login))
router.post('/logout', asyncWrap(logout))
router.get('/me', requireAuth, asyncWrap(me))
router.patch('/preferences', requireAuth, asyncWrap(updatePreferences))

export default router

