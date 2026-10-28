import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  summary,
  topics,
  trends,
  subjects,
  clusters,
  insights,
  triggerSync
} from '../controllers/analytics.controller.js'
import { requireFacultyOrAdmin } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: {
    success: false,
    message: 'Too many analytics requests. Please wait a moment.'
  }
})

// Protected institutional analytics routes: only accessible to Faculty and Administrators
router.use(analyticsLimiter)
router.use(asyncWrap(requireFacultyOrAdmin))

router.get('/summary', asyncWrap(summary))
router.get('/topics', asyncWrap(topics))
router.get('/trends', asyncWrap(trends))
router.get('/subjects', asyncWrap(subjects))
router.get('/clusters', asyncWrap(clusters))
router.get('/insights', asyncWrap(insights))
router.post('/sync', asyncWrap(triggerSync))

export default router
