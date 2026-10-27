import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  doubt: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  },
  answer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  answerUpvote: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import {
  createAnswer,
  listAnswers,
  upvoteAnswer,
  removeUpvote
} from '../src/services/answer.service'
import { HttpError } from '../src/middleware/errorHandler'

describe('Feature 3 & 5: Threaded Answers and Upvoting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (operation: (tx: typeof prismaMock) => unknown) => operation(prismaMock))
  })

  it('creates a root answer successfully', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue({ id: 'doubt-1' })
    const created = {
      id: 'ans-1',
      doubtId: 'doubt-1',
      authorId: 'user-1',
      content: 'Here is the primary solution',
      parentAnswerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      upvotes: [],
      replies: []
    }
    prismaMock.answer.create.mockResolvedValue(created)

    const result = await createAnswer({
      doubtId: 'doubt-1',
      authorId: 'user-1',
      content: 'Here is the primary solution'
    })

    expect(result.id).toBe('ans-1')
    expect(result.parentAnswerId).toBeNull()
  })

  it('creates a nested reply to an existing answer', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue({ id: 'doubt-1' })
    prismaMock.answer.findUnique.mockResolvedValue({
      id: 'ans-1',
      doubtId: 'doubt-1',
      isDeleted: false
    })
    const replyCreated = {
      id: 'ans-2',
      doubtId: 'doubt-1',
      authorId: 'user-2',
      content: 'I agree with your solution!',
      parentAnswerId: 'ans-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      upvotes: [],
      replies: []
    }
    prismaMock.answer.create.mockResolvedValue(replyCreated)

    const result = await createAnswer({
      doubtId: 'doubt-1',
      authorId: 'user-2',
      content: 'I agree with your solution!',
      parentAnswerId: 'ans-1'
    })

    expect(result.parentAnswerId).toBe('ans-1')
  })

  it('rejects a reply if parent answer belongs to another doubt', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue({ id: 'doubt-1' })
    prismaMock.answer.findUnique.mockResolvedValue({
      id: 'ans-other',
      doubtId: 'doubt-999', // Different doubt
      isDeleted: false
    })

    await expect(
      createAnswer({
        doubtId: 'doubt-1',
        authorId: 'user-2',
        content: 'Cross doubt reply',
        parentAnswerId: 'ans-other'
      })
    ).rejects.toMatchObject<HttpError>({
      statusCode: 400,
      message: 'Parent answer belongs to a different doubt'
    })
  })

  it('upvotes an answer and returns updated count and isUpvotedByMe', async () => {
    const answerRecord = {
      id: 'ans-1',
      doubtId: 'doubt-1',
      isDeleted: false,
      upvotes: [{ userId: 'user-1', value: 1 }],
      _count: { upvotes: 1 }
    }
    prismaMock.answer.findUnique.mockResolvedValue(answerRecord)
    prismaMock.answerUpvote.upsert.mockResolvedValue({ userId: 'user-1', answerId: 'ans-1', value: 1 })

    const result = await upvoteAnswer('ans-1', 'user-1')

    expect(prismaMock.answerUpvote.upsert).toHaveBeenCalledWith({
      where: { userId_answerId: { userId: 'user-1', answerId: 'ans-1' } },
      create: { userId: 'user-1', answerId: 'ans-1', value: 1 },
      update: { value: 1 }
    })
    expect(result.isUpvotedByMe).toBe(true)
    expect(result._count.upvotes).toBe(1)
  })

  it('removes upvote cleanly and updates state', async () => {
    const answerRecord = {
      id: 'ans-1',
      doubtId: 'doubt-1',
      isDeleted: false,
      upvotes: [],
      _count: { upvotes: 0 }
    }
    prismaMock.answer.findUnique.mockResolvedValue(answerRecord)
    prismaMock.doubt.findUnique.mockResolvedValue({ id: 'doubt-1', acceptedAnswerId: null })
    prismaMock.answerUpvote.findUnique.mockResolvedValue({ userId: 'user-1', answerId: 'ans-1', value: 1 })
    prismaMock.answerUpvote.delete.mockResolvedValue({ userId: 'user-1', answerId: 'ans-1' })

    const result = await removeUpvote('ans-1', 'user-1')

    expect(prismaMock.answerUpvote.delete).toHaveBeenCalledWith({
      where: { userId_answerId: { userId: 'user-1', answerId: 'ans-1' } }
    })
    expect(result.isUpvotedByMe).toBe(false)
    expect(result._count.upvotes).toBe(0)
  })

  it('orders answers with accepted answer first, then highest votes, then deterministic createdAt', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue({ id: 'doubt-1', acceptedAnswerId: 'ans-accepted' })
    const now = new Date()
    const earlier = new Date(now.getTime() - 10000)
    const later = new Date(now.getTime() + 10000)

    prismaMock.answer.findMany.mockResolvedValue([
      {
        id: 'ans-popular',
        doubtId: 'doubt-1',
        content: 'Popular answer',
        parentAnswerId: null,
        createdAt: later,
        isDeleted: false,
        upvotes: [{ userId: 'u1', value: 1 }, { userId: 'u2', value: 1 }]
      },
      {
        id: 'ans-normal',
        doubtId: 'doubt-1',
        content: 'Normal answer',
        parentAnswerId: null,
        createdAt: earlier,
        isDeleted: false,
        upvotes: [{ userId: 'u1', value: 1 }]
      },
      {
        id: 'ans-accepted',
        doubtId: 'doubt-1',
        content: 'Accepted best answer',
        parentAnswerId: null,
        createdAt: now,
        isDeleted: false,
        upvotes: [] // 0 upvotes, but accepted
      }
    ])

    const answers = await listAnswers('doubt-1', 'u1')

    // Accepted answer must come first even with 0 upvotes
    expect(answers[0].id).toBe('ans-accepted')
    expect(answers[0].isAccepted).toBe(true)

    // Next is popular answer with 2 upvotes
    expect(answers[1].id).toBe('ans-popular')
    expect(answers[1].voteSummary?.upvotes).toBe(2)

    // Last is normal answer with 1 upvote
    expect(answers[2].id).toBe('ans-normal')
  })
})
