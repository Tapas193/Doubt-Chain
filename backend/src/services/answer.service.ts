import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'
import { createNotification } from './notification.service.js'

const answerInclude = {
  author: { select: { id: true, username: true, displayName: true } },
  _count: { select: { upvotes: true } },
  upvotes: { select: { userId: true, value: true } }
} as const

function serializeAnswer(
  answer: any,
  viewerId?: string,
  acceptedAnswerId?: string | null
): any {
  const upvotes = answer.upvotes || []
  const upvoteCount = upvotes.filter((vote: any) => vote.value === 1).length
  const downvoteCount = upvotes.filter((vote: any) => vote.value === -1).length
  const viewerVote = viewerId
    ? upvotes.find((vote: any) => vote.userId === viewerId)?.value ?? 0
    : 0
  const isUpvotedByMe = viewerVote === 1
  const isAccepted = Boolean(acceptedAnswerId && acceptedAnswerId === answer.id)

  const rawReplies = answer.replies || []
  const replies = rawReplies
    .filter((r: any) => !r.isDeleted)
    .map((r: any) => serializeAnswer(r, viewerId, acceptedAnswerId))

  return {
    id: answer.id,
    content: answer.isDeleted ? '[This answer was deleted]' : answer.content,
    mediaUrl: answer.mediaUrl,
    mediaType: answer.mediaType,
    isDeleted: answer.isDeleted,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
    authorId: answer.authorId,
    doubtId: answer.doubtId,
    parentAnswerId: answer.parentAnswerId ?? null,
    author: answer.author,
    isAccepted,
    isUpvotedByMe,
    _count: { upvotes: upvoteCount },
    voteSummary: { upvotes: upvoteCount, downvotes: downvoteCount, viewerVote },
    replies
  }
}

async function getActiveAnswer(answerId: string, viewerId?: string) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      ...answerInclude,
      replies: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
        include: answerInclude
      }
    }
  })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }

  const doubt = await prisma.doubt.findUnique({
    where: { id: answer.doubtId },
    select: { acceptedAnswerId: true }
  })

  return serializeAnswer(answer, viewerId, doubt?.acceptedAnswerId)
}

export async function createAnswer(input: {
  doubtId: string
  authorId: string
  content: string
  parentAnswerId?: string
  mediaUrl?: string
  mediaType?: 'IMAGE' | 'AUDIO'
}) {
  const doubt = await prisma.doubt.findUnique({
    where: { id: input.doubtId },
    include: { community: true }
  })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }

  // Strict privacy rule: if college discussion is not shared with wider network,
  // only approved members or platform admins can reply.
  if (doubt.communityId && !doubt.isSharedWithWiderNetwork) {
    const author = await prisma.user.findUnique({
      where: { id: input.authorId },
      select: { role: true, email: true }
    })
    const isPlatformAdmin = author?.role === 'ADMIN' || Boolean(author?.email?.toLowerCase().includes('admin@'))
    if (!isPlatformAdmin) {
      const membership = await prisma.communityMember.findFirst({
        where: {
          communityId: doubt.communityId,
          userId: input.authorId,
          status: 'APPROVED'
        }
      })
      if (!membership) {
        throw new HttpError(403, 'Forbidden: Only verified community members can reply to this private college discussion')
      }
    }
  }

  let effectiveParentId = input.parentAnswerId
  if (input.parentAnswerId) {
    const parent = await prisma.answer.findUnique({ where: { id: input.parentAnswerId } })
    if (!parent || parent.isDeleted) {
      throw new HttpError(404, 'Parent answer not found')
    }
    if (parent.doubtId !== input.doubtId) {
      throw new HttpError(400, 'Parent answer belongs to a different doubt')
    }
    // Fold replies to replies into the top-level thread to keep clean 1-level hierarchy
    if (parent.parentAnswerId) {
      effectiveParentId = parent.parentAnswerId
    }
  }

  const created = await prisma.answer.create({
    data: {
      doubtId: input.doubtId,
      authorId: input.authorId,
      content: input.content,
      parentAnswerId: effectiveParentId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType
    },
    include: {
      ...answerInclude,
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          communityMemberships: {
            where: { status: 'APPROVED', isPrimary: true },
            select: { community: { select: { id: true, name: true, code: true } } }
          }
        }
      },
      replies: {
        where: { isDeleted: false },
        include: answerInclude
      }
    }
  })

  // Notify original doubt author if someone else answered
  if (doubt.authorId !== input.authorId) {
    const responderName = created.author?.displayName || 'A peer'
    const responderCollege = (created.author as any)?.communityMemberships?.[0]?.community?.code
    const isWiderReply = doubt.isSharedWithWiderNetwork && Boolean(responderCollege)

    createNotification({
      userId: doubt.authorId,
      type: isWiderReply ? 'WIDER_NETWORK_REPLY' : 'NEW_REPLY',
      title: isWiderReply ? 'Wider Network Reply' : 'New Reply to Your Discussion',
      message: isWiderReply
        ? `${responderName} from [${responderCollege}] answered your shared question: "${doubt.title}"`
        : `${responderName} posted a reply on your discussion: "${doubt.title}"`,
      linkUrl: `/doubts/${doubt.id}`
    }).catch(console.error)
  }

  return serializeAnswer(created, input.authorId, doubt.acceptedAnswerId)
}

export async function listAnswers(doubtId: string, viewerId?: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } })
  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }

  const rawAnswers = await prisma.answer.findMany({
    where: { doubtId },
    orderBy: { createdAt: 'asc' },
    include: answerInclude
  })

  const topLevel = rawAnswers.filter((a) => !a.parentAnswerId)
  const replies = rawAnswers.filter((a) => Boolean(a.parentAnswerId))

  const topLevelWithReplies = topLevel.map((parent) => {
    const childReplies = replies.filter((r) => r.parentAnswerId === parent.id)
    return {
      ...parent,
      replies: childReplies
    }
  })

  const visible = topLevelWithReplies.filter(
    (a) => !a.isDeleted || a.replies.some((r: any) => !r.isDeleted)
  )

  const serialized = visible.map((a) =>
    serializeAnswer(a, viewerId, doubt.acceptedAnswerId)
  )

  // Sort: 1) Accepted answer first, 2) Upvote count descending, 3) createdAt ascending
  serialized.sort((a: any, b: any) => {
    if (a.isAccepted && !b.isAccepted) return -1
    if (!a.isAccepted && b.isAccepted) return 1
    const voteDiff = (b.voteSummary?.upvotes ?? 0) - (a.voteSummary?.upvotes ?? 0)
    if (voteDiff !== 0) return voteDiff
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return serialized
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
  const { authorId, doubtId, parentAnswerId, ...safe } = data
  await prisma.answer.update({
    where: { id: answerId },
    data: safe
  })

  return getActiveAnswer(answerId, userId)
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

export async function upvoteAnswer(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }

  // Atomic PostgreSQL upsert (ON CONFLICT): prevents race conditions on concurrent upvote requests
  await prisma.answerUpvote.upsert({
    where: { userId_answerId: { userId, answerId } },
    create: { userId, answerId, value: 1 },
    update: { value: 1 }
  })

  return getActiveAnswer(answerId, userId)
}

export async function removeUpvote(answerId: string, userId: string) {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } })
  if (!answer || answer.isDeleted) {
    throw new HttpError(404, 'Answer not found')
  }

  try {
    await prisma.answerUpvote.delete({
      where: {
        userId_answerId: { userId, answerId }
      }
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      // If already deleted/not voted, safe idempotent return
      return getActiveAnswer(answerId, userId)
    }
    throw err
  }

  return getActiveAnswer(answerId, userId)
}

export async function setAnswerVote(answerId: string, userId: string, value: 1 | -1) {
  if (value === 1) {
    return upvoteAnswer(answerId, userId)
  }

  await prisma.$transaction(async (tx) => {
    const answer = await tx.answer.findUnique({ where: { id: answerId } })
    if (!answer || answer.isDeleted) {
      throw new HttpError(404, 'Answer not found')
    }

    const existing = await tx.answerUpvote.findUnique({
      where: { userId_answerId: { userId, answerId } }
    })
    if (!existing) {
      await tx.answerUpvote.create({ data: { userId, answerId, value: -1 } })
    } else if (existing.value === -1) {
      await tx.answerUpvote.delete({ where: { userId_answerId: { userId, answerId } } })
    } else {
      await tx.answerUpvote.update({
        where: { userId_answerId: { userId, answerId } },
        data: { value: -1 }
      })
    }
  })
  return getActiveAnswer(answerId, userId)
}

export const removeAnswerVote = removeUpvote
