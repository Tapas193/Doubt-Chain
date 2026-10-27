import { Request, Response } from 'express'
import { askDoubtAssistant, translateContent } from '../services/ai.service.js'
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

export async function translate(req: Request, res: Response) {
  const { text, targetLang } = req.body

  if (typeof text !== 'string' || !text.trim()) {
    throw new HttpError(400, 'Text to translate is required')
  }

  if (text.length > 5000) {
    throw new HttpError(400, 'Text must be at most 5000 characters')
  }

  const allowedLangs = ['en', 'hi', 'hinglish']
  if (!targetLang || !allowedLangs.includes(targetLang)) {
    throw new HttpError(400, 'targetLang must be one of: en, hi, hinglish')
  }

  const result = await translateContent({
    text: text.trim(),
    targetLang: targetLang as 'en' | 'hi' | 'hinglish'
  })

  res.json(ok(result, 'Translated successfully'))
}

