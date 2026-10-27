import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

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
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      subject: { select: { id: true, name: true, code: true } },
      _count: { select: { answers: true } }
    }
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
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { answers: true } }
      }
    }),
    prisma.doubt.count({ where })
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}

export async function getDoubtById(id: string) {
  const doubt = await prisma.doubt.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      subject: { select: { id: true, name: true, code: true } },
      answers: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, username: true, displayName: true } },
          _count: { select: { upvotes: true } }
        }
      }
    }
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
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      subject: { select: { id: true, name: true, code: true } }
    }
  })
}

export async function resolveDoubt(id: string, userId: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  if (doubt.authorId !== userId) {
    throw new HttpError(403, 'Only the doubt owner can resolve this doubt')
  }
  if (doubt.isResolved) {
    return prisma.doubt.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        subject: { select: { id: true, name: true, code: true } }
      }
    })
  }
  return prisma.doubt.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date()
    },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      subject: { select: { id: true, name: true, code: true } }
    }
  })
}

export async function searchDoubts(input: { q: string; subjectId?: string; page?: number; limit?: number }) {
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

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isResolved: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { answers: true } }
      }
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
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        subject: { select: { id: true, name: true, code: true } },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, username: true, displayName: true } },
            _count: { select: { upvotes: true } }
          }
        }
      }
    }),
    prisma.doubt.count({ where })
  ])

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
}
