import { Response } from 'express'
import { createComment, deleteComment, listComments } from '../services/comment.service.js'
import { AuthRequest } from '../middleware/auth.js'
import { ok } from '../utils/http.js'

export async function list(req: AuthRequest, res: Response) {
  const comments = await listComments(req.params.answerId)
  res.json(ok(comments))
}

export async function create(req: AuthRequest, res: Response) {
  const comment = await createComment({
    answerId: req.params.answerId,
    authorId: req.user!.userId,
    content: req.body.content
  })
  res.status(201).json(ok(comment, 'Comment created'))
}

export async function remove(req: AuthRequest, res: Response) {
  const result = await deleteComment(req.params.answerId, req.params.commentId, req.user!.userId)
  res.json(ok(result, 'Comment deleted'))
}
