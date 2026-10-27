import { Router } from 'express'
import { update, remove, upvote, downvote } from '../controllers/answer.controller.js'
import { validate } from '../middleware/validate.js'
import { answerParamsSchema, updateAnswerSchema } from '../validators/answer.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.patch('/:answerId', requireAuth, validate(updateAnswerSchema), asyncWrap(update))
router.delete('/:answerId', requireAuth, validate(answerParamsSchema), asyncWrap(remove))
router.post('/:answerId/upvote', requireAuth, validate(answerParamsSchema), asyncWrap(upvote))
router.delete('/:answerId/upvote', requireAuth, validate(answerParamsSchema), asyncWrap(downvote))

export default router
