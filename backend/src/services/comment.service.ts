import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

const commentInclude = {
  author: { select: { id: true, username: true, displayName: true } }
} as const

async function requireActiveAnswer(answerId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }
}

export async function listComments(answerId: string) {
  await requireActiveAnswer(answerId)
  return prisma.answerComment.findMany({
    where: { answerId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: commentInclude
  })
}

export async function createComment(input: { answerId: string; authorId: string; content: string }) {
  await requireActiveAnswer(input.answerId)
  return prisma.answerComment.create({
    data: { answerId: input.answerId, authorId: input.authorId, content: input.content },
    include: commentInclude
  })
}

export async function deleteComment(answerId: string, commentId: string, userId: string) {
  const comment = await prisma.answerComment.findUnique({ where: { id: commentId } })
  if (!comment || comment.answerId !== answerId || comment.isDeleted) {
    throw new HttpError(404, 'Comment not found')
  }
  if (comment.authorId !== userId) {
    throw new HttpError(403, 'Forbidden')
  }

  await prisma.answerComment.update({ where: { id: commentId }, data: { isDeleted: true } })
  return { deleted: true }
}
