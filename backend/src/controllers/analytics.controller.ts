import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { ok } from '../utils/http.js'
import { HttpError } from '../middleware/errorHandler.js'
import {
  getAnalyticsSummary,
  getMostAskedTopics,
  getDoubtTrends,
  getSubjectWiseStats,
  getSimilarDoubtClusters,
  getActionableAcademicInsights,
  syncPendingDoubtAssignments,
  AnalyticsFilters
} from '../services/analytics.service.js'

function parseFilters(req: AuthRequest): AnalyticsFilters {
  const { startDate, endDate, subjectId, limit, page } = req.query

  const parsedLimit = limit ? parseInt(limit as string, 10) : undefined
  const parsedPage = page ? parseInt(page as string, 10) : undefined

  if (parsedLimit !== undefined && (isNaN(parsedLimit) || parsedLimit < 1)) {
    throw new HttpError(400, 'Limit must be a positive number')
  }
  if (parsedPage !== undefined && (isNaN(parsedPage) || parsedPage < 1)) {
    throw new HttpError(400, 'Page must be a positive number')
  }

  return {
    startDate: typeof startDate === 'string' ? startDate : undefined,
    endDate: typeof endDate === 'string' ? endDate : undefined,
    subjectId: typeof subjectId === 'string' && subjectId.trim() ? subjectId.trim() : undefined,
    limit: parsedLimit,
    page: parsedPage
  }
}

export async function summary(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getAnalyticsSummary(filters, req.user)
  res.json(ok(result))
}

export async function topics(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getMostAskedTopics(filters, req.user)
  res.json(ok(result))
}

export async function trends(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getDoubtTrends(filters, req.user)
  res.json(ok(result))
}

export async function subjects(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getSubjectWiseStats(filters, req.user)
  res.json(ok(result))
}

export async function clusters(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getSimilarDoubtClusters(filters, req.user)
  res.json(ok(result))
}

export async function insights(req: AuthRequest, res: Response) {
  if (!req.user) throw new HttpError(401, 'Unauthorized')
  const filters = parseFilters(req)
  const result = await getActionableAcademicInsights(filters, req.user)
  res.json(ok(result))
}

export async function triggerSync(_req: AuthRequest, res: Response) {
  const synced = await syncPendingDoubtAssignments()
  res.json(ok({ synced }, `Clustered ${synced} doubts`))
}
