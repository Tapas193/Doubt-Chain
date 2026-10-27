import { Router } from 'express'
import { update, remove, upvote, downvote, vote, removeVote } from '../controllers/answer.controller.js'
import { create as createComment, list as listComments, remove as removeComment } from '../controllers/comment.controller.js'
import { validate } from '../middleware/validate.js'
import { answerParamsSchema, updateAnswerSchema, voteAnswerSchema } from '../validators/answer.js'
import { answerCommentsParamsSchema, createCommentSchema, deleteCommentSchema } from '../validators/comment.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'

const router = Router()

router.patch('/:answerId', requireAuth, validate(updateAnswerSchema), asyncWrap(update))
router.delete('/:answerId', requireAuth, validate(answerParamsSchema), asyncWrap(remove))
router.post('/:answerId/upvote', requireAuth, validate(answerParamsSchema), asyncWrap(upvote))
router.delete('/:answerId/upvote', requireAuth, validate(answerParamsSchema), asyncWrap(downvote))
router.post('/:answerId/votes', requireAuth, validate(voteAnswerSchema), asyncWrap(vote))
router.delete('/:answerId/votes', requireAuth, validate(answerParamsSchema), asyncWrap(removeVote))
router.get('/:answerId/comments', optionalAuth, validate(answerCommentsParamsSchema), asyncWrap(listComments))
router.post('/:answerId/comments', requireAuth, validate(createCommentSchema), asyncWrap(createComment))
router.delete('/:answerId/comments/:commentId', requireAuth, validate(deleteCommentSchema), asyncWrap(removeComment))

export default router
