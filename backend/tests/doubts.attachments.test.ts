import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  subject: {
    findUnique: vi.fn()
  },
  doubt: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn()
  },
  attachment: {
    createMany: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import { createDoubt } from '../src/services/doubt.service'
import { HttpError } from '../src/middleware/errorHandler'

describe('Feature 2: Text, Image, and Voice Doubts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (operation: (tx: typeof prismaMock) => unknown) => operation(prismaMock))
  })

  it('creates valid text-only doubt', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({ id: 'sub-1' })
    const createdRecord = {
      id: 'doubt-1',
      title: 'What is memoization in dynamic programming?',
      content: 'Can someone explain memoization vs tabulation?',
      subjectId: 'sub-1',
      authorId: 'user-1',
      attachments: []
    }
    prismaMock.doubt.create.mockResolvedValue(createdRecord)
    prismaMock.doubt.findUniqueOrThrow.mockResolvedValue(createdRecord)

    const result = await createDoubt({
      title: 'What is memoization in dynamic programming?',
      content: 'Can someone explain memoization vs tabulation?',
      subjectId: 'sub-1',
      authorId: 'user-1'
    })

    expect(prismaMock.doubt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'What is memoization in dynamic programming?',
        content: 'Can someone explain memoization vs tabulation?',
        subjectId: 'sub-1',
        authorId: 'user-1'
      })
    })
    expect(result.id).toBe('doubt-1')
  })

  it('rejects doubt creation with invalid subject', async () => {
    prismaMock.subject.findUnique.mockResolvedValue(null)

    await expect(
      createDoubt({
        title: 'Invalid subject doubt',
        content: 'Explaining something with missing subject',
        subjectId: 'non-existent',
        authorId: 'user-1'
      })
    ).rejects.toMatchObject<HttpError>({
      statusCode: 400,
      message: 'Invalid subject'
    })
    expect(prismaMock.doubt.create).not.toHaveBeenCalled()
  })

  it('persists image and voice attachments metadata atomically', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({ id: 'sub-1' })
    const createdRecord = {
      id: 'doubt-2',
      title: 'Circuit diagram analysis question',
      content: 'Attached diagram and voice note describing the circuit.',
      subjectId: 'sub-1',
      authorId: 'user-1',
      mediaUrl: '/uploads/diagram.png',
      mediaType: 'IMAGE',
      attachments: [
        { id: 'att-1', url: '/uploads/diagram.png', filename: 'diagram.png', fileType: 'IMAGE', mimeType: 'image/png', size: 102400 },
        { id: 'att-2', url: '/uploads/audio.webm', filename: 'audio.webm', fileType: 'AUDIO', mimeType: 'audio/webm', size: 51200 }
      ]
    }
    prismaMock.doubt.create.mockResolvedValue(createdRecord)
    prismaMock.attachment.createMany.mockResolvedValue({ count: 2 })
    prismaMock.doubt.findUniqueOrThrow.mockResolvedValue(createdRecord)

    const result = await createDoubt({
      title: 'Circuit diagram analysis question',
      content: 'Attached diagram and voice note describing the circuit.',
      subjectId: 'sub-1',
      authorId: 'user-1',
      attachments: [
        { url: '/uploads/diagram.png', filename: 'diagram.png', fileType: 'IMAGE', mimeType: 'image/png', size: 102400 },
        { url: '/uploads/audio.webm', filename: 'audio.webm', fileType: 'AUDIO', mimeType: 'audio/webm', size: 51200 }
      ]
    })

    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.attachment.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ url: '/uploads/diagram.png', fileType: 'IMAGE', doubtId: 'doubt-2' }),
        expect.objectContaining({ url: '/uploads/audio.webm', fileType: 'AUDIO', doubtId: 'doubt-2' })
      ])
    })
    expect(result.attachments).toHaveLength(2)
  })
})
