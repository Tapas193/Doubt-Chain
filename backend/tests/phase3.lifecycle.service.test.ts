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
    update: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import { deleteAnswer } from '../src/services/answer.service'
import { acceptAnswer, reopenDoubt, resolveDoubt } from '../src/services/doubt.service'
import { HttpError } from '../src/middleware/errorHandler'

const ownerDoubt = { id: 'doubt-1', authorId: 'owner-1', isResolved: false }
const activeAnswer = { id: 'answer-1', doubtId: 'doubt-1', authorId: 'author-2', isDeleted: false }

describe('Phase 3 doubt and answer lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (operation: (tx: typeof prismaMock) => unknown) => operation(prismaMock))
  })

  it('accepts an active answer on the owner’s doubt atomically', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue(ownerDoubt)
    prismaMock.answer.findUnique.mockResolvedValue(activeAnswer)
    prismaMock.doubt.update.mockResolvedValue({ ...ownerDoubt, isResolved: true, acceptedAnswerId: activeAnswer.id })

    const result = await acceptAnswer('doubt-1', 'answer-1', 'owner-1')

    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.doubt.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'doubt-1' },
      data: expect.objectContaining({ isResolved: true, acceptedAnswerId: 'answer-1', resolvedAt: expect.any(Date) })
    }))
    expect(result).toMatchObject({ isResolved: true, acceptedAnswerId: 'answer-1' })
  })

  it('rejects accepting an answer owned by another doubt', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue(ownerDoubt)
    prismaMock.answer.findUnique.mockResolvedValue({ ...activeAnswer, doubtId: 'doubt-2' })

    await expect(acceptAnswer('doubt-1', 'answer-1', 'owner-1')).rejects.toMatchObject<HttpError>({ statusCode: 400 })
    expect(prismaMock.doubt.update).not.toHaveBeenCalled()
  })

  it('rejects an accept attempt by someone other than the doubt owner', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue(ownerDoubt)

    await expect(acceptAnswer('doubt-1', 'answer-1', 'other-user')).rejects.toMatchObject<HttpError>({ statusCode: 403 })
    expect(prismaMock.answer.findUnique).not.toHaveBeenCalled()
  })

  it('keeps the legacy resolve route safe by requiring exactly one active answer', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue(ownerDoubt)
    prismaMock.answer.findMany.mockResolvedValue([])

    await expect(resolveDoubt('doubt-1', 'owner-1')).rejects.toMatchObject<HttpError>({ statusCode: 400 })
  })

  it('reopens only the owner’s doubt and clears its accepted answer', async () => {
    prismaMock.doubt.findUnique.mockResolvedValue({ ...ownerDoubt, isResolved: true, acceptedAnswerId: 'answer-1' })
    prismaMock.doubt.update.mockResolvedValue({ ...ownerDoubt, isResolved: false, acceptedAnswerId: null })

    await reopenDoubt('doubt-1', 'owner-1')

    expect(prismaMock.doubt.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isResolved: false, resolvedAt: null, acceptedAnswerId: null })
    }))
  })

  it('soft-deletes an accepted answer and reopens its doubt in one transaction', async () => {
    prismaMock.answer.findUnique.mockResolvedValue(activeAnswer)
    prismaMock.answer.update.mockResolvedValue({ ...activeAnswer, isDeleted: true })
    prismaMock.doubt.updateMany.mockResolvedValue({ count: 1 })

    const result = await deleteAnswer('answer-1', 'author-2')

    expect(result).toEqual({ deleted: true })
    expect(prismaMock.answer.update).toHaveBeenCalledWith({ where: { id: 'answer-1' }, data: { isDeleted: true } })
    expect(prismaMock.doubt.updateMany).toHaveBeenCalledWith({
      where: { id: 'doubt-1', acceptedAnswerId: 'answer-1' },
      data: { isResolved: false, resolvedAt: null, acceptedAnswerId: null }
    })
  })
})
