import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  subject: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn()
  },
  subjectMember: {
    findUnique: vi.fn(),
    create: vi.fn()
  },
  doubt: {
    findMany: vi.fn(),
    count: vi.fn()
  }
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import {
  listSubjects,
  getSubjectById,
  joinSubject,
  joinSubjectByCode
} from '../src/services/subject.service'
import { listDoubts } from '../src/services/doubt.service'
import { HttpError } from '../src/middleware/errorHandler'

describe('Feature 1: Subject-Wise Doubt Boards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists subjects without exposing private join codes', async () => {
    prismaMock.subject.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        name: 'Data Structures',
        code: 'CS201',
        description: 'DSA course',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { doubts: 5, members: 12 },
        members: []
      }
    ])

    const subjects = await listSubjects({ viewerId: 'user-1' })
    expect(subjects).toHaveLength(1)
    expect(subjects[0].name).toBe('Data Structures')
    expect(subjects[0].isMember).toBe(false)
    expect((subjects[0] as any).joinCode).toBeUndefined()
  })

  it('filters doubts by subjectId correctly', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({ id: 'sub-1', name: 'Data Structures' })
    prismaMock.doubt.findMany.mockResolvedValue([
      {
        id: 'doubt-1',
        title: 'Binary Search Tree',
        content: 'How does insertion work?',
        subjectId: 'sub-1',
        isResolved: false
      }
    ])
    prismaMock.doubt.count.mockResolvedValue(1)

    const result = await listDoubts({ subjectId: 'sub-1' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].subjectId).toBe('sub-1')
  })

  it('rejects filtering doubts by non-existent subject', async () => {
    prismaMock.subject.findUnique.mockResolvedValue(null)

    await expect(listDoubts({ subjectId: 'invalid-sub' })).rejects.toMatchObject<HttpError>({
      statusCode: 404,
      message: 'Subject not found'
    })
  })

  it('allows joining subject with valid join code', async () => {
    prismaMock.subject.findUnique.mockResolvedValueOnce({
      id: 'sub-1',
      code: 'CS201',
      joinCode: 'DS-201'
    }).mockResolvedValueOnce({
      id: 'sub-1',
      name: 'Data Structures',
      code: 'CS201',
      members: [{ id: 'mem-1' }]
    })

    prismaMock.subjectMember.findUnique.mockResolvedValue(null)
    prismaMock.subjectMember.create.mockResolvedValue({ id: 'mem-1', userId: 'user-1', subjectId: 'sub-1' })

    const result = await joinSubject('sub-1', 'user-1', 'DS-201')
    expect(prismaMock.subjectMember.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', subjectId: 'sub-1' }
    })
    expect(result?.isMember).toBe(true)
  })

  it('rejects joining with invalid join code', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({
      id: 'sub-1',
      code: 'CS201',
      joinCode: 'DS-201'
    })

    await expect(joinSubject('sub-1', 'user-1', 'WRONG-CODE')).rejects.toMatchObject<HttpError>({
      statusCode: 400,
      message: 'Invalid join code for this subject'
    })
    expect(prismaMock.subjectMember.create).not.toHaveBeenCalled()
  })

  it('prevents duplicate membership', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({
      id: 'sub-1',
      code: 'CS201',
      joinCode: 'DS-201'
    })
    prismaMock.subjectMember.findUnique.mockResolvedValue({
      id: 'mem-1',
      userId: 'user-1',
      subjectId: 'sub-1'
    })

    await expect(joinSubject('sub-1', 'user-1', 'DS-201')).rejects.toMatchObject<HttpError>({
      statusCode: 409,
      message: 'You are already a member of this subject board'
    })
  })

  it('joins directly using global join code lookup', async () => {
    prismaMock.subject.findFirst.mockResolvedValue({
      id: 'sub-1',
      code: 'CS201',
      joinCode: 'DS-201'
    })
    prismaMock.subject.findUnique.mockResolvedValueOnce({
      id: 'sub-1',
      code: 'CS201',
      joinCode: 'DS-201'
    }).mockResolvedValueOnce({
      id: 'sub-1',
      name: 'Data Structures',
      code: 'CS201',
      members: [{ id: 'mem-1' }]
    })
    prismaMock.subjectMember.findUnique.mockResolvedValue(null)
    prismaMock.subjectMember.create.mockResolvedValue({ id: 'mem-1', userId: 'user-1', subjectId: 'sub-1' })

    const result = await joinSubjectByCode('user-1', 'DS-201')
    expect(result?.isMember).toBe(true)
  })
})
