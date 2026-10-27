import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  ask,
  translate,
  getConversations,
  getConversationById,
  deleteConversationById,
  feedback,
  report
} from '../controllers/ai.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again shortly.'
  }
})

// Ask Study Assistant (supports single questions & multi-turn conversations)
router.post('/ask', requireAuth, aiLimiter, asyncWrap(ask))

// Conversation history management
router.get('/conversations', requireAuth, asyncWrap(getConversations))
router.get('/conversations/:id', requireAuth, asyncWrap(getConversationById))
router.delete('/conversations/:id', requireAuth, asyncWrap(deleteConversationById))

// Feedback & Reports
router.post('/feedback', requireAuth, asyncWrap(feedback))
router.post('/report', requireAuth, asyncWrap(report))

// Translation
router.post('/translate', requireAuth, aiLimiter, asyncWrap(translate))

export default router
