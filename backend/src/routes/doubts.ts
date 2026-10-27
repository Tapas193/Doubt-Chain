import { Router } from 'express'
import { create, list, getById, update, resolve, search } from '../controllers/doubt.controller.js'
import { validate } from '../middleware/validate.js'
import { createDoubtSchema, listDoubtsQuerySchema, doubtParamsSchema, updateDoubtSchema, searchDoubtsQuerySchema } from '../validators/doubt.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { create as createAnswerCtrl, list as listAnswersCtrl } from '../controllers/answer.controller.js'
import { createAnswerSchema } from '../validators/answer.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.get('/search', optionalAuth, validate(searchDoubtsQuerySchema), asyncWrap(search))
router.get('/', optionalAuth, validate(listDoubtsQuerySchema), asyncWrap(list))
router.post('/', requireAuth, validate(createDoubtSchema), asyncWrap(create))
router.get('/:id', optionalAuth, validate(doubtParamsSchema), asyncWrap(getById))
router.patch('/:id', requireAuth, validate(updateDoubtSchema), asyncWrap(update))
router.post('/:id/resolve', requireAuth, validate(doubtParamsSchema), asyncWrap(resolve))
router.get('/:id/answers', optionalAuth, validate(doubtParamsSchema), asyncWrap(listAnswersCtrl))
router.post('/:id/answers', requireAuth, validate(createAnswerSchema), asyncWrap(createAnswerCtrl))

export default router
