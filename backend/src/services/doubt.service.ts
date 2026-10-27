import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

const doubtSummaryInclude = {
  author: { select: { id: true, username: true, displayName: true } },
  subject: { select: { id: true, name: true, code: true } },
  acceptedAnswer: {
    select: { id: true, content: true, authorId: true, createdAt: true }
  },
  _count: { select: { answers: { where: { isDeleted: false } } } }
} as const

const doubtDetailInclude = {
  ...doubtSummaryInclude,
  answers: {
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  }
} as const

type ListFilters = {
  subjectId?: string
  isResolved?: boolean
  page?: number
  limit?: number
}

export async function createDoubt(input: {
  title: string
  content: string
  subjectId: string
  authorId: string
  mediaUrl?: string
  mediaType?: 'IMAGE' | 'AUDIO'
}) {
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } })
  if (!subject) {
    throw new HttpError(400, 'Invalid subject')
  }
  return prisma.doubt.create({
    data: {
      title: input.title,
      content: input.content,
      subjectId: input.subjectId,
      authorId: input.authorId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType
    },
    include: doubtSummaryInclude
  })
}

export async function listDoubts(filters: ListFilters) {
  const page = filters.page || 1
  const limit = filters.limit || 10
  const skip = (page - 1) * limit

  const where: any = {}
  if (filters.subjectId) where.subjectId = filters.subjectId
  if (typeof filters.isResolved === 'boolean') where.isResolved = filters.isResolved

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: doubtSummaryInclude
    }),
    prisma.doubt.count({ where })
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}

export async function getDoubtById(id: string) {
  const doubt = await prisma.doubt.findUnique({
    where: { id },
    include: doubtDetailInclude
  })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  return doubt
}

export async function updateDoubt(id: string, userId: string, data: any) {
  const doubt = await prisma.doubt.findUnique({ where: { id } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  if (doubt.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }
  const { isResolved, resolvedAt, authorId, subjectId, ...safe } = data
  return prisma.doubt.update({
    where: { id },
    data: safe,
    include: doubtSummaryInclude
  })
}

export async function acceptAnswer(id: string, answerId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const doubt = await tx.doubt.findUnique({ where: { id } })
    if (!doubt) {
      throw new HttpError(404, 'Doubt not found')
    }
    if (doubt.authorId !== userId) {
      throw new HttpError(403, 'Only the doubt owner can resolve this doubt')
    }
    const answer = await tx.answer.findUnique({ where: { id: answerId } })
    if (!answer || answer.doubtId !== id || answer.isDeleted) {
      throw new HttpError(400, 'Answer must be an active answer on this doubt')
    }

    return tx.doubt.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date(), acceptedAnswerId: answerId },
      include: doubtSummaryInclude
    })
  })
}

export async function resolveDoubt(id: string, userId: string, answerId?: string) {
  if (answerId) {
    return acceptAnswer(id, answerId, userId)
  }

  const doubt = await prisma.doubt.findUnique({ where: { id } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  if (doubt.authorId !== userId) {
    throw new HttpError(403, 'Only the doubt owner can resolve this doubt')
  }
  const activeAnswers = await prisma.answer.findMany({
    where: { doubtId: id, isDeleted: false },
    select: { id: true }
  })
  if (activeAnswers.length !== 1) {
    throw new HttpError(400, 'Choose an answer to resolve this doubt')
  }
  return acceptAnswer(id, activeAnswers[0].id, userId)
}

export async function reopenDoubt(id: string, userId: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  if (doubt.authorId !== userId) {
    throw new HttpError(403, 'Only the doubt owner can reopen this doubt')
  }

  return prisma.doubt.update({
    where: { id },
    data: { isResolved: false, resolvedAt: null, acceptedAnswerId: null },
    include: doubtSummaryInclude
  })
}

export async function searchDoubts(input: { q: string; subjectId?: string; isResolved?: boolean; page?: number; limit?: number }) {
  const page = input.page || 1
  const limit = input.limit || 10
  const skip = (page - 1) * limit
  const query = input.q.trim()

  if (!query) {
    return { items: [], page, limit, total: 0, totalPages: 0 }
  }

  const where: any = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ]
  }
  if (input.subjectId) where.subjectId = input.subjectId
  if (typeof input.isResolved === 'boolean') where.isResolved = input.isResolved

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isResolved: 'desc' }, { createdAt: 'desc' }],
      include: doubtSummaryInclude
    }),
    prisma.doubt.count({ where })
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}

export async function listFaq(input: { subjectId?: string; q?: string; page?: number; limit?: number }) {
  const page = input.page || 1
  const limit = input.limit || 10
  const skip = (page - 1) * limit

  const where: any = { isResolved: true }
  if (input.subjectId) where.subjectId = input.subjectId
  if (input.q && input.q.trim()) {
    const query = input.q.trim()
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { resolvedAt: 'desc' },
      include: doubtDetailInclude
    }),
    prisma.doubt.count({ where })
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}
