import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

const answerInclude = {
  author: { select: { id: true, username: true, displayName: true } },
  _count: { select: { upvotes: true } },
  upvotes: { select: { userId: true, value: true } }
} as const

function serializeAnswer<T extends {
  upvotes: Array<{ userId: string; value: number }>
  _count: { upvotes: number }
}>(answer: T, viewerId?: string) {
  const { upvotes, _count, ...rest } = answer
  const upvoteCount = upvotes.filter(vote => vote.value === 1).length
  const downvoteCount = upvotes.filter(vote => vote.value === -1).length
  const viewerVote = viewerId ? upvotes.find(vote => vote.userId === viewerId)?.value ?? 0 : 0

  return {
    ...rest,
    _count: { ..._count, upvotes: upvoteCount },
    voteSummary: { upvotes: upvoteCount, downvotes: downvoteCount, viewerVote }
  }
}

async function getActiveAnswer(answerId: string, viewerId?: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId }, include: answerInclude })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }
  return serializeAnswer(answer, viewerId)
}

export async function createAnswer(input: {
  doubtId: string
  authorId: string
  content: string
  mediaUrl?: string
  mediaType?: 'IMAGE' | 'AUDIO'
}) {
  const doubt = await prisma.doubt.findUnique({ where: { id: input.doubtId } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  return prisma.answer.create({
    data: {
      doubtId: input.doubtId,
      authorId: input.authorId,
      content: input.content,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType
    },
    include: answerInclude
  })
  .then(answer => serializeAnswer(answer))
}

export async function listAnswers(doubtId: string, viewerId?: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  const answers = await prisma.answer.findMany({
    where: { doubtId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: answerInclude
  })
  return answers.map(answer => serializeAnswer(answer, viewerId))
}

export async function updateAnswer(answerId: string, userId: string, data: any) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer) {
    throw new HttpError(404, 'Answer not found')
  }
  if (answer.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }
  if (answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }
  const { authorId, doubtId, ...safe } = data
  return prisma.answer.update({
    where: { id: answerId },
    data: safe,
    include: answerInclude
  })
  .then(answer => serializeAnswer(answer, userId))
}

export async function deleteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer) {
    throw new HttpError(404, 'Answer not found')
  }
  if (answer.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }
  if (answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.answer.update({ where: { id: answerId }, data: { isDeleted: true } })
    if (answer.doubtId) {
      await tx.doubt.updateMany({
        where: { id: answer.doubtId, acceptedAnswerId: answerId },
        data: { isResolved: false, resolvedAt: null, acceptedAnswerId: null }
      })
    }
    return true
  })
  return { deleted }
}

export async function setAnswerVote(answerId: string, userId: string, value: 1 | -1) {
  await prisma.$transaction(async (tx) => {
    const answer = await tx.answer.findUnique({ where: { id: answerId } })
    if (!answer || answer.isDeleted) {
      throw new HttpError(404, 'Answer not found')
    }

    const existing = await tx.answerUpvote.findUnique({
      where: { userId_answerId: { userId, answerId } }
    })
    if (!existing) {
      await tx.answerUpvote.create({ data: { userId, answerId, value } })
    } else if (existing.value === value) {
      await tx.answerUpvote.delete({ where: { userId_answerId: { userId, answerId } } })
    } else {
      await tx.answerUpvote.update({
        where: { userId_answerId: { userId, answerId } },
        data: { value }
      })
    }
  })
  return getActiveAnswer(answerId, userId)
}

export async function removeAnswerVote(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }
  try {
    await prisma.answerUpvote.delete({
      where: {
        userId_answerId: {
          userId,
          answerId
        }
      }
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      throw new HttpError(404, 'Upvote not found')
    }
    throw err
  }
  return getActiveAnswer(answerId, userId)
}

// Legacy aliases retained for the existing Phase 3 API contract.
export const upvoteAnswer = (answerId: string, userId: string) => setAnswerVote(answerId, userId, 1)
export const removeUpvote = removeAnswerVote
