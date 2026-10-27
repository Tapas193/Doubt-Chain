import { Router } from 'express'
import { list, getById } from '../controllers/subject.controller.js'
import { validate } from '../middleware/validate.js'
import { subjectParamsSchema } from '../validators/subject.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.get('/', asyncWrap(list))
router.get('/:id', validate(subjectParamsSchema), asyncWrap(getById))

export default router
