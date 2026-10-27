import { Request, Response } from 'express'
import { listSubjects, getSubjectById } from '../services/subject.service.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function list(_req: Request, res: Response) {
  const subjects = await listSubjects()
  res.json(ok(subjects))
}

export async function getById(req: Request, res: Response) {
  const subject = await getSubjectById(req.params.id)
  if (!subject) {
    throw new HttpError(404, 'Subject not found')
  }
  res.json(ok(subject))
}
