import { Response } from 'express'
import {
  listSubjects,
  getSubjectById,
  joinSubject,
  joinSubjectByCode
} from '../services/subject.service.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response) {
  const { q } = req.query as { q?: string }
  const subjects = await listSubjects({ q, viewerId: req.user?.userId })
  res.json(ok(subjects))
}

export async function getById(req: AuthRequest, res: Response) {
  const subject = await getSubjectById(req.params.id, req.user?.userId)
  if (!subject) {
    throw new HttpError(404, 'Subject not found')
  }
  res.json(ok(subject))
}

export async function join(req: AuthRequest, res: Response) {
  const { joinCode } = req.body
  const subject = await joinSubject(req.params.id, req.user!.userId, joinCode)
  res.json(ok(subject, 'Joined subject board successfully'))
}

export async function joinByCode(req: AuthRequest, res: Response) {
  const { joinCode } = req.body
  const subject = await joinSubjectByCode(req.user!.userId, joinCode)
  res.json(ok(subject, 'Joined subject board successfully'))
}
