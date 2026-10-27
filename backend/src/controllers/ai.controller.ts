import { Response } from 'express'
import {
  askStudyAssistant,
  translateContent,
  listConversations,
  getConversation,
  deleteConversation,
  recordAiFeedback,
  recordAiReport
} from '../services/ai.service.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'
import { AuthRequest } from '../middleware/auth.js'

export async function ask(req: AuthRequest, res: Response) {
  const {
    question,
    subject,
    subjectId,
    mode,
    conversationId,
    history,
    responseLanguage
  } = req.body

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

  const allowedLangs = ['en', 'hi', 'hinglish']
  if (responseLanguage !== undefined && !allowedLangs.includes(responseLanguage)) {
    throw new HttpError(400, 'Invalid response language')
  }

  if (subject !== undefined && typeof subject !== 'string') {
    throw new HttpError(400, 'Subject must be a string')
  }
  if (subjectId !== undefined && typeof subjectId !== 'string') {
    throw new HttpError(400, 'subjectId must be a string')
  }
  if (conversationId !== undefined && typeof conversationId !== 'string') {
    throw new HttpError(400, 'conversationId must be a string')
  }

  if (history !== undefined && !Array.isArray(history)) {
    throw new HttpError(400, 'history must be an array of messages')
  }

  const result = await askStudyAssistant({
    userId: req.user?.userId,
    question,
    subjectName: subject,
    subjectId,
    mode,
    conversationId,
    history,
    responseLanguage
  })

  res.json(ok(result))
}

export async function getConversations(req: AuthRequest, res: Response) {
  if (!req.user?.userId) {
    throw new HttpError(401, 'Unauthorized')
  }
  const conversations = await listConversations(req.user.userId)
  res.json(ok(conversations))
}

export async function getConversationById(req: AuthRequest, res: Response) {
  if (!req.user?.userId) {
    throw new HttpError(401, 'Unauthorized')
  }
  const conversation = await getConversation(req.user.userId, req.params.id)
  res.json(ok(conversation))
}

export async function deleteConversationById(req: AuthRequest, res: Response) {
  if (!req.user?.userId) {
    throw new HttpError(401, 'Unauthorized')
  }
  const result = await deleteConversation(req.user.userId, req.params.id)
  res.json(ok(result, 'Conversation deleted'))
}

export async function feedback(req: AuthRequest, res: Response) {
  if (!req.user?.userId) {
    throw new HttpError(401, 'Unauthorized')
  }
  const { messageId, isHelpful } = req.body

  if (typeof messageId !== 'string' || !messageId.trim()) {
    throw new HttpError(400, 'messageId is required')
  }
  if (typeof isHelpful !== 'boolean') {
    throw new HttpError(400, 'isHelpful must be a boolean')
  }

  const result = await recordAiFeedback({
    userId: req.user.userId,
    messageId,
    isHelpful
  })

  res.json(ok(result, 'Feedback recorded'))
}

export async function report(req: AuthRequest, res: Response) {
  if (!req.user?.userId) {
    throw new HttpError(401, 'Unauthorized')
  }
  const { messageId, reason, details } = req.body

  const allowedReasons = [
    'FACTUALLY_INCORRECT',
    'INCORRECT_CODE',
    'MISLEADING_EXPLANATION',
    'TRANSLATION_ISSUE',
    'OTHER'
  ]

  if (typeof messageId !== 'string' || !messageId.trim()) {
    throw new HttpError(400, 'messageId is required')
  }
  if (!reason || !allowedReasons.includes(reason)) {
    throw new HttpError(400, 'Valid report reason is required')
  }
  if (details !== undefined && typeof details !== 'string') {
    throw new HttpError(400, 'details must be a string')
  }
  if (details && details.length > 500) {
    throw new HttpError(400, 'details cannot exceed 500 characters')
  }

  const result = await recordAiReport({
    userId: req.user.userId,
    messageId,
    reason,
    details
  })

  res.json(ok(result, result.message))
}

export async function translate(req: AuthRequest, res: Response) {
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
