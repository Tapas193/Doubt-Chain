import { Router } from 'express'
import { faq } from '../controllers/doubt.controller.js'
import { validate } from '../middleware/validate.js'
import { faqQuerySchema } from '../validators/faq.js'
import { optionalAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.get('/', optionalAuth, validate(faqQuerySchema), asyncWrap(faq))

export default router
