import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { ask } from '../controllers/ai.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again shortly.'
  }
})

router.post('/ask', requireAuth, aiLimiter, asyncWrap(ask))

export default router
