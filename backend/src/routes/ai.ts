import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { ask, translate } from '../controllers/ai.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again shortly.'
  }
})

router.post('/ask', requireAuth, aiLimiter, asyncWrap(ask))
router.post('/translate', requireAuth, aiLimiter, asyncWrap(translate))

export default router

