import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'
import {
  generateEmbedding,
  cosineSimilarity,
  computeContentHash,
  generateFaqFromAcceptedAnswer
} from './ai.service.js'

const doubtSummaryInclude = {
  author: { select: { id: true, username: true, displayName: true } },
  subject: { select: { id: true, name: true, code: true } },
  acceptedAnswer: {
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  },
  attachments: {
    select: {
      id: true,
      url: true,
      filename: true,
      fileType: true,
      mimeType: true,
      size: true,
      extractedText: true,
      processingStatus: true,
      processingError: true
    }
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
      attachments: {
        select: {
          id: true,
          url: true,
          filename: true,
          fileType: true,
          mimeType: true,
          size: true,
          extractedText: true,
          processingStatus: true,
          processingError: true
        }
      },
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
  attachments?: Array<{
    url: string
    filename: string
    fileType: 'IMAGE' | 'AUDIO'
    mimeType: string
    size: number
  }>
}) {
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } })
  if (!subject) {
    throw new HttpError(400, 'Invalid subject')
  }

  // Derive mediaUrl/mediaType from first attachment if not explicitly passed
  let primaryMediaUrl = input.mediaUrl
  let primaryMediaType = input.mediaType
  if (!primaryMediaUrl && input.attachments && input.attachments.length > 0) {
    primaryMediaUrl = input.attachments[0].url
    primaryMediaType = input.attachments[0].fileType
  }

  return prisma.$transaction(async (tx) => {
    const doubt = await tx.doubt.create({
      data: {
        title: input.title,
        content: input.content,
        subjectId: input.subjectId,
        authorId: input.authorId,
        mediaUrl: primaryMediaUrl,
        mediaType: primaryMediaType
      }
    })

    if (input.attachments && input.attachments.length > 0) {
      await tx.attachment.createMany({
        data: input.attachments.map((att: any) => ({
          url: att.url,
          filename: att.filename,
          fileType: att.fileType,
          mimeType: att.mimeType,
          size: att.size,
          extractedText: att.extractedText || null,
          processingStatus: att.processingStatus || 'COMPLETED',
          processingError: att.processingError || null,
          doubtId: doubt.id,
          uploaderId: input.authorId
        }))
      })
    }

    return tx.doubt.findUniqueOrThrow({
      where: { id: doubt.id },
      include: doubtSummaryInclude
    })
  })
}

export async function listDoubts(filters: ListFilters) {
  const page = filters.page || 1
  const limit = filters.limit || 10
  const skip = (page - 1) * limit

  const where: any = {}
  if (filters.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: filters.subjectId } })
    if (!subject) {
      throw new HttpError(404, 'Subject not found')
    }
    where.subjectId = filters.subjectId
  }
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
  const { isResolved, resolvedAt, authorId, subjectId, attachments, ...safe } = data
  return prisma.doubt.update({
    where: { id },
    data: safe,
    include: doubtSummaryInclude
  })
}

export async function acceptAnswer(id: string, answerId: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
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

  // Asynchronously trigger AI FAQ generation and embedding update (safe and non-blocking)
  ;(async () => {
    try {
      const full = await prisma.doubt.findUnique({
        where: { id },
        include: {
          subject: true,
          acceptedAnswer: true,
          attachments: true
        }
      })
      if (!full || !full.acceptedAnswer) return

      // 1. Generate FAQ with AI
      const faq = await generateFaqFromAcceptedAnswer({
        doubtTitle: full.title,
        doubtContent: full.content,
        acceptedAnswerContent: full.acceptedAnswer.content,
        subjectName: full.subject.name
      })

      if (faq) {
        await prisma.doubt.update({
          where: { id },
          data: {
            aiQuestion: faq.question,
            aiAnswer: faq.answer,
            aiTags: faq.tags,
            aiGeneratedAt: new Date(),
            aiStatus: 'COMPLETED'
          }
        })
      }

      // 2. Semantic Embedding update
      const attTexts = full.attachments.map(a => a.extractedText).filter(Boolean).join(' ')
      const textToEmbed = `${full.title}\n${full.content}\n${attTexts}\nSolution: ${full.acceptedAnswer.content}`
      const hash = computeContentHash([full.title, full.content, full.acceptedAnswer.content, attTexts])
      const vector = await generateEmbedding(textToEmbed)

      if (vector) {
        await prisma.doubtEmbedding.upsert({
          where: { doubtId: id },
          create: {
            doubtId: id,
            contentHash: hash,
            vector
          },
          update: {
            contentHash: hash,
            vector
          }
        })
      }
    } catch (err) {
      console.warn('[AI Pipeline] Background accept processing error:', err)
    }
  })()

  return result
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
    data: {
      isResolved: false,
      resolvedAt: null,
      acceptedAnswerId: null,
      aiQuestion: null,
      aiAnswer: null,
      aiTags: [],
      aiGeneratedAt: null
    },
    include: doubtSummaryInclude
  })
}

export async function searchDoubts(input: {
  q: string
  subjectId?: string
  isResolved?: boolean
  page?: number
  limit?: number
}) {
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
      { content: { contains: query, mode: 'insensitive' } },
      { aiQuestion: { contains: query, mode: 'insensitive' } },
      { aiAnswer: { contains: query, mode: 'insensitive' } },
      { attachments: { some: { extractedText: { contains: query, mode: 'insensitive' } } } },
      { acceptedAnswer: { content: { contains: query, mode: 'insensitive' } } }
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

export async function findSmartDuplicates(input: {
  q: string
  subjectId?: string
  threshold?: number
  limit?: number
}) {
  const query = input.q.trim()
  if (!query) return []
  const threshold = input.threshold ?? 0.65
  const limit = input.limit ?? 3

  // 1. Generate query embedding via Gemini
  const queryEmbedding = await generateEmbedding(query)

  // 2. Query candidates: resolved doubts with accepted answers
  const where: any = {
    isResolved: true,
    acceptedAnswerId: { not: null },
    acceptedAnswer: { isDeleted: false }
  }
  if (input.subjectId) {
    where.subjectId = input.subjectId
  }

  const resolvedDoubts = await prisma.doubt.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      acceptedAnswer: {
        select: {
          id: true,
          content: true,
          author: { select: { id: true, username: true, displayName: true } }
        }
      },
      attachments: {
        select: {
          extractedText: true
        }
      },
      embedding: true
    },
    take: 50
  })

  if (resolvedDoubts.length === 0) return []

  // If embedding succeeded, compute semantic cosine similarity
  if (queryEmbedding && queryEmbedding.length > 0) {
    const scored: Array<{
      doubt: typeof resolvedDoubts[0]
      similarity: number
    }> = []

    for (const doubt of resolvedDoubts) {
      let vector = doubt.embedding?.vector
      const attachmentTexts = doubt.attachments.map(a => a.extractedText).filter(Boolean).join(' ')
      const currentHash = computeContentHash([
        doubt.title,
        doubt.content,
        doubt.acceptedAnswer?.content,
        attachmentTexts
      ])

      // Reuse cached vector if hash matches; otherwise regenerate and cache
      if (!vector || doubt.embedding?.contentHash !== currentHash) {
        const textToEmbed = `${doubt.title}\n${doubt.content}\n${attachmentTexts}\nSolution: ${doubt.acceptedAnswer?.content || ''}`
        const newVec = await generateEmbedding(textToEmbed)
        if (newVec) {
          vector = newVec
          Promise.resolve(
            prisma.doubtEmbedding.upsert({
              where: { doubtId: doubt.id },
              create: {
                doubtId: doubt.id,
                contentHash: currentHash,
                vector: newVec
              },
              update: {
                contentHash: currentHash,
                vector: newVec
              }
            })
          ).catch(err => console.warn('[DoubtEmbedding] Cache error:', err))
        }
      }

      if (vector && vector.length > 0) {
        const sim = cosineSimilarity(queryEmbedding, vector)
        if (sim >= threshold) {
          scored.push({ doubt, similarity: sim })
        }
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity)
    const topMatches = scored.slice(0, limit)

    return topMatches.map(({ doubt, similarity }) => ({
      id: doubt.id,
      title: doubt.title,
      contentSnippet: doubt.content.slice(0, 160),
      similarity: Number(similarity.toFixed(3)),
      similarityPercent: Math.round(similarity * 100),
      matchType: 'semantic' as const,
      subject: doubt.subject,
      acceptedAnswer: doubt.acceptedAnswer ? {
        id: doubt.acceptedAnswer.id,
        content: doubt.acceptedAnswer.content.slice(0, 200),
        author: doubt.acceptedAnswer.author
      } : null,
      aiSummary: doubt.aiAnswer ? doubt.aiAnswer.slice(0, 180) : null,
      discussionUrl: `/doubts/${doubt.id}`
    }))
  }

  // Fallback: If AI provider is unavailable, rate-limited, or fails,
  // perform intelligent token-based keyword matching
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const fallbackMatches = resolvedDoubts
    .map(d => {
      const full = `${d.title} ${d.content} ${d.aiQuestion || ''} ${d.aiAnswer || ''}`.toLowerCase()
      const matchCount = keywords.filter(k => full.includes(k)).length
      const score = keywords.length > 0 ? matchCount / keywords.length : 0
      return { doubt: d, score }
    })
    .filter(m => m.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return fallbackMatches.map(({ doubt, score }) => ({
    id: doubt.id,
    title: doubt.title,
    contentSnippet: doubt.content.slice(0, 160),
    similarity: Number((0.60 + score * 0.35).toFixed(3)),
    similarityPercent: Math.round((0.60 + score * 0.35) * 100),
    matchType: 'keyword_fallback' as const,
    subject: doubt.subject,
    acceptedAnswer: doubt.acceptedAnswer ? {
      id: doubt.acceptedAnswer.id,
      content: doubt.acceptedAnswer.content.slice(0, 200),
      author: doubt.acceptedAnswer.author
    } : null,
    aiSummary: doubt.aiAnswer ? doubt.aiAnswer.slice(0, 180) : null,
    discussionUrl: `/doubts/${doubt.id}`
  }))
}

export async function recordSearchFeedback(input: {
  userId: string
  doubtId?: string
  action: 'ANSWERED_MY_DOUBT' | 'NONE_HELPED_POSTED'
  query: string
}) {
  const normalizedQuery = input.query.trim().toLowerCase()
  const existing = await prisma.searchFeedback.findFirst({
    where: {
      userId: input.userId,
      doubtId: input.doubtId || null,
      action: input.action,
      query: normalizedQuery
    }
  })
  if (existing) {
    return existing
  }
  return prisma.searchFeedback.create({
    data: {
      userId: input.userId,
      doubtId: input.doubtId || null,
      action: input.action,
      query: normalizedQuery
    }
  })
}

export async function listFaq(input: {
  subjectId?: string
  q?: string
  sortBy?: 'recent' | 'popular'
  page?: number
  limit?: number
}) {
  const page = input.page || 1
  const limit = input.limit || 10
  const skip = (page - 1) * limit

  const where: any = {
    isResolved: true,
    acceptedAnswerId: { not: null },
    acceptedAnswer: { isDeleted: false }
  }

  if (input.subjectId) where.subjectId = input.subjectId
  if (input.q && input.q.trim()) {
    const query = input.q.trim()
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { aiQuestion: { contains: query, mode: 'insensitive' } },
      { aiAnswer: { contains: query, mode: 'insensitive' } },
      { acceptedAnswer: { content: { contains: query, mode: 'insensitive' } } }
    ]
  }

  const orderBy: any = input.sortBy === 'popular'
    ? { answers: { _count: 'desc' } }
    : { resolvedAt: 'desc' }

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        subject: { select: { id: true, name: true, code: true } },
        acceptedAnswer: {
          select: {
            id: true,
            content: true,
            authorId: true,
            createdAt: true,
            author: { select: { id: true, username: true, displayName: true } },
            _count: { select: { upvotes: true } }
          }
        },
        _count: { select: { answers: { where: { isDeleted: false } } } }
      }
    }),
    prisma.doubt.count({ where })
  ])

  // Filter out any anomalous records where acceptedAnswer did not populate
  const validItems = items
    .filter(d => d.acceptedAnswer != null)
    .map(d => ({
      ...d,
      isAiGenerated: Boolean(d.aiAnswer && d.aiQuestion)
    }))

  return { items: validItems, page, limit, total, totalPages: Math.ceil(total / limit) }
}

