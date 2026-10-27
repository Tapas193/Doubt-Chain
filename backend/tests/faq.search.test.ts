import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  doubt: {
    findMany: vi.fn(),
    count: vi.fn()
  }
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import { searchDoubts, listFaq } from '../src/services/doubt.service'

describe('Feature 4 & 6: Search Before Posting and FAQ Archive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches resolved doubts for suggestions before posting', async () => {
    prismaMock.doubt.findMany.mockResolvedValue([
      {
        id: 'doubt-resolved',
        title: 'How does Dijkstra algorithm work?',
        content: 'Shortest path explanation',
        isResolved: true,
        subjectId: 'sub-cs201'
      }
    ])
    prismaMock.doubt.count.mockResolvedValue(1)

    const result = await searchDoubts({
      q: 'Dijkstra',
      subjectId: 'sub-cs201',
      isResolved: true
    })

    expect(prismaMock.doubt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isResolved: true,
          subjectId: 'sub-cs201',
          OR: expect.arrayContaining([
            { title: { contains: 'Dijkstra', mode: 'insensitive' } },
            { content: { contains: 'Dijkstra', mode: 'insensitive' } }
          ])
        })
      })
    )
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('doubt-resolved')
  })

  it('handles empty query gracefully without database call', async () => {
    const result = await searchDoubts({ q: '   ' })
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(prismaMock.doubt.findMany).not.toHaveBeenCalled()
  })

  it('returns only resolved doubts with accepted best answer in FAQ', async () => {
    prismaMock.doubt.findMany.mockResolvedValue([
      {
        id: 'faq-1',
        title: 'ACID Properties in DBMS',
        content: 'Atomicity, Consistency, Isolation, Durability explained',
        isResolved: true,
        acceptedAnswerId: 'ans-1',
        acceptedAnswer: {
          id: 'ans-1',
          content: 'Here is the comprehensive explanation of ACID...',
          author: { id: 'u1', username: 'dbguru', displayName: 'DB Guru' }
        },
        subject: { id: 'sub-dbms', name: 'Database Management Systems', code: 'CS205' },
        author: { id: 'u2', username: 'student1', displayName: 'Student One' }
      }
    ])
    prismaMock.doubt.count.mockResolvedValue(1)

    const faq = await listFaq({ q: 'ACID', subjectId: 'sub-dbms' })

    expect(prismaMock.doubt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isResolved: true,
          acceptedAnswerId: { not: null },
          subjectId: 'sub-dbms'
        })
      })
    )
    expect(faq.items).toHaveLength(1)
    expect(faq.items[0].acceptedAnswer).toBeDefined()
    expect(faq.items[0].acceptedAnswer?.id).toBe('ans-1')
  })

  it('searches existing doubts including matching accepted answer content and without isResolved restriction', async () => {
    prismaMock.doubt.findMany.mockResolvedValue([
      {
        id: 'doubt-mul',
        title: 'Multiplexer vs demultiplexer',
        content: 'Differences with applications.',
        isResolved: false
      }
    ])
    prismaMock.doubt.count.mockResolvedValue(1)

    const res = await searchDoubts({ q: 'mul' })

    expect(prismaMock.doubt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: 'mul', mode: 'insensitive' } },
            { content: { contains: 'mul', mode: 'insensitive' } },
            { acceptedAnswer: { content: { contains: 'mul', mode: 'insensitive' } } }
          ])
        })
      })
    )
    expect(res.items).toHaveLength(1)
    expect(res.items[0].title).toBe('Multiplexer vs demultiplexer')
  })
})
