import { Response } from 'express'
import {
  createDoubt,
  listDoubts,
  getDoubtById,
  updateDoubt,
  resolveDoubt,
  searchDoubts,
  listFaq
} from '../services/doubt.service.js'
import { ok } from '../utils/http.js'
import { AuthRequest } from '../middleware/auth.js'

export async function create(req: AuthRequest, res: Response) {
  const doubt = await createDoubt({
    ...req.body,
    authorId: req.user!.userId
  })
  res.status(201).json(ok(doubt, 'Doubt created'))
}

export async function list(req: AuthRequest, res: Response) {
  const { subjectId, isResolved, page, limit } = req.query as any
  const result = await listDoubts({
    subjectId,
    isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  })
  res.json(ok(result))
}

export async function getById(req: AuthRequest, res: Response) {
  const doubt = await getDoubtById(req.params.id)
  res.json(ok(doubt))
}

export async function update(req: AuthRequest, res: Response) {
  const doubt = await updateDoubt(req.params.id, req.user!.userId, req.body)
  res.json(ok(doubt, 'Doubt updated'))
}

export async function resolve(req: AuthRequest, res: Response) {
  const doubt = await resolveDoubt(req.params.id, req.user!.userId)
  res.json(ok(doubt, 'Doubt resolved'))
}

export async function search(req: AuthRequest, res: Response) {
  const { q, subjectId, page, limit } = req.query as any
  const result = await searchDoubts({
    q,
    subjectId,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  })
  res.json(ok(result))
}

export async function faq(req: AuthRequest, res: Response) {
  const { subjectId, q, page, limit } = req.query as any
  const result = await listFaq({
    subjectId,
    q,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  })
  res.json(ok(result))
}
