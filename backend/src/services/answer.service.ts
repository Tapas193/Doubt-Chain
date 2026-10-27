import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

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
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  })
}

export async function listAnswers(doubtId: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }
  return prisma.answer.findMany({
    where: { doubtId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  })
}

export async function updateAnswer(answerId: string, userId: string, data: any) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer) {
    throw new HttpError(404, 'Answer not found')
  }
  if (answer.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }
  const { authorId, doubtId, ...safe } = data
  return prisma.answer.update({
    where: { id: answerId },
    data: safe,
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  })
}

export async function deleteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer) {
    throw new HttpError(404, 'Answer not found')
  }
  if (answer.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }
  await prisma.answer.delete({ where: { id: answerId } })
  return { deleted: true }
}

export async function upvoteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer) {
    throw new HttpError(404, 'Answer not found')
  }
  try {
    await prisma.answerUpvote.create({
      data: {
        userId,
        answerId
      }
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Already upvoted')
    }
    throw err
  }
  return prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  })
}

export async function removeUpvote(answerId: string, userId: string) {
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
  return prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { upvotes: true } }
    }
  })
}
