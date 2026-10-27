import { Router } from 'express'
import { list, getById, join, joinByCode } from '../controllers/subject.controller.js'
import { validate } from '../middleware/validate.js'
import {
  subjectParamsSchema,
  joinSubjectSchema,
  joinByCodeSchema,
  listSubjectsQuerySchema
} from '../validators/subject.js'
import { asyncWrap } from '../utils/asyncWrap.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, validate(listSubjectsQuerySchema), asyncWrap(list))
router.post('/join', requireAuth, validate(joinByCodeSchema), asyncWrap(joinByCode))
router.get('/:id', optionalAuth, validate(subjectParamsSchema), asyncWrap(getById))
router.post('/:id/join', requireAuth, validate(joinSubjectSchema), asyncWrap(join))

export default router
