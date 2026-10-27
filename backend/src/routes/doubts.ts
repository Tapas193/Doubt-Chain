import { Router } from 'express'
import { create, list, getById, update, resolve, accept, reopen, search, smartSearch, feedback } from '../controllers/doubt.controller.js'
import { validate } from '../middleware/validate.js'
import {
  acceptDoubtSchema,
  createDoubtSchema,
  listDoubtsQuerySchema,
  doubtParamsSchema,
  resolveDoubtSchema,
  updateDoubtSchema,
  searchDoubtsQuerySchema,
  smartSearchQuerySchema,
  searchFeedbackSchema
} from '../validators/doubt.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { create as createAnswerCtrl, list as listAnswersCtrl } from '../controllers/answer.controller.js'
import { createAnswerSchema } from '../validators/answer.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.get('/smart-duplicates', optionalAuth, validate(smartSearchQuerySchema), asyncWrap(smartSearch))
router.post('/search-feedback', requireAuth, validate(searchFeedbackSchema), asyncWrap(feedback))
router.get('/search', optionalAuth, validate(searchDoubtsQuerySchema), asyncWrap(search))
router.get('/', optionalAuth, validate(listDoubtsQuerySchema), asyncWrap(list))
router.post('/', requireAuth, validate(createDoubtSchema), asyncWrap(create))
router.get('/:id', optionalAuth, validate(doubtParamsSchema), asyncWrap(getById))
router.patch('/:id', requireAuth, validate(updateDoubtSchema), asyncWrap(update))
router.post('/:id/resolve', requireAuth, validate(resolveDoubtSchema), asyncWrap(resolve))
router.post('/:id/accept', requireAuth, validate(acceptDoubtSchema), asyncWrap(accept))
router.post('/:id/reopen', requireAuth, validate(doubtParamsSchema), asyncWrap(reopen))
router.get('/:id/answers', optionalAuth, validate(doubtParamsSchema), asyncWrap(listAnswersCtrl))
router.post('/:id/answers', requireAuth, validate(createAnswerSchema), asyncWrap(createAnswerCtrl))

export default router
