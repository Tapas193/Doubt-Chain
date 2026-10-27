import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../validators/auth.js'
import { requireAuth } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20
})

router.post('/register', authLimiter, validate(registerSchema), asyncWrap(register))
router.post('/login', authLimiter, validate(loginSchema), asyncWrap(login))
router.post('/logout', asyncWrap(logout))
router.get('/me', requireAuth, asyncWrap(me))

export default router
