import { Response } from 'express'
import { createAnswer, listAnswers, updateAnswer, deleteAnswer, upvoteAnswer, removeUpvote } from '../services/answer.service.js'
import { ok } from '../utils/http.js'
import { AuthRequest } from '../middleware/auth.js'

export async function create(req: AuthRequest, res: Response) {
  const answer = await createAnswer({
    doubtId: req.params.id,
    authorId: req.user!.userId,
    ...req.body
  })
  res.status(201).json(ok(answer, 'Answer created'))
}

export async function list(req: AuthRequest, res: Response) {
  const answers = await listAnswers(req.params.id)
  res.json(ok(answers))
}

export async function update(req: AuthRequest, res: Response) {
  const answer = await updateAnswer(req.params.answerId, req.user!.userId, req.body)
  res.json(ok(answer, 'Answer updated'))
}

export async function remove(req: AuthRequest, res: Response) {
  const result = await deleteAnswer(req.params.answerId, req.user!.userId)
  res.json(ok(result, 'Answer deleted'))
}

export async function upvote(req: AuthRequest, res: Response) {
  const answer = await upvoteAnswer(req.params.answerId, req.user!.userId)
  res.json(ok(answer, 'Upvoted'))
}

export async function downvote(req: AuthRequest, res: Response) {
  const answer = await removeUpvote(req.params.answerId, req.user!.userId)
  res.json(ok(answer, 'Upvote removed'))
}
