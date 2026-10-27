import { Request, Response } from 'express'
import { askDoubtAssistant } from '../services/ai.service.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function ask(req: Request, res: Response) {
  const { question, subject, mode } = req.body

  if (typeof question !== 'string' || !question.trim()) {
    throw new HttpError(400, 'Question is required')
  }

  if (question.length > 5000) {
    throw new HttpError(400, 'Question must be at most 5000 characters')
  }

  const allowedModes = ['beginner', 'step-by-step', 'example', 'hinglish', 'debug']

  if (mode !== undefined && !allowedModes.includes(mode)) {
    throw new HttpError(400, 'Invalid explanation mode')
  }

  if (subject !== undefined && typeof subject !== 'string') {
    throw new HttpError(400, 'Subject must be a string')
  }

  const answer = await askDoubtAssistant({ question, subject, mode })

  res.json(ok({
    answer,
    generatedBy: 'Gemini AI',
    disclaimer: 'AI-generated explanation. Verify important information.'
  }))
}
