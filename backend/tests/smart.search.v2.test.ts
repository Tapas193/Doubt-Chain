import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchDoubts, findSmartDuplicates } from '../src/services/doubt.service.js'
import * as aiService from '../src/services/ai.service.js'
import { prisma } from '../src/config/prisma.js'

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    doubt: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    doubtEmbedding: {
      upsert: vi.fn()
    }
  }
}))

describe('Smart Search 2.0 Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Feature 1: handles empty queries without querying database', async () => {
    const res = await searchDoubts({ q: '   ' })
    expect(res.items).toEqual([])
    expect(res.total).toBe(0)
    expect(prisma.doubt.findMany).not.toHaveBeenCalled()
  })

  it('Feature 2: Hybrid search combines semantic similarity and keyword scores', async () => {
    // Mock 3072-dim embeddings
    const queryVector = new Array(3072).fill(0.01)
    const matchingVector = new Array(3072).fill(0.01)

    vi.spyOn(aiService, 'generateEmbedding').mockResolvedValueOnce(queryVector)

    const candidates = [
      {
        id: 'doubt-unresolved-exact',
        title: 'Binary Search Algorithm',
        content: 'How does binary search work on sorted arrays?',
        isResolved: false,
        acceptedAnswerId: null,
        acceptedAnswer: null,
        aiAnswer: null,
        subjectId: 'sub-cs',
        subject: { id: 'sub-cs', name: 'Computer Science', code: 'CS101' },
        createdAt: new Date('2026-10-01'),
        embedding: { vector: matchingVector }
      },
      {
        id: 'doubt-resolved-partial',
        title: 'Sorting Algorithms Overview',
        content: 'Quick sort and merge sort explanation.',
        isResolved: true,
        acceptedAnswerId: 'ans-1',
        acceptedAnswer: { id: 'ans-1', content: 'Use merge sort for stability.' },
        aiAnswer: 'Overview of standard sorting routines.',
        subjectId: 'sub-cs',
        subject: { id: 'sub-cs', name: 'Computer Science', code: 'CS101' },
        createdAt: new Date('2026-09-01'),
        embedding: { vector: matchingVector }
      }
    ]

    vi.mocked(prisma.doubt.findMany).mockResolvedValueOnce(candidates as any)

    const result = await searchDoubts({ q: 'binary search' })

    expect(result.searchMode).toBe('hybrid')
    expect(result.items.length).toBe(2)
    // The exact title match should rank first even though it is unresolved!
    expect(result.items[0].id).toBe('doubt-unresolved-exact')
    expect(result.items[0].matchType).toBe('hybrid')
    expect(result.items[0].relevanceScore).toBeGreaterThan(0)
    expect(result.items[0].contentSnippet).toContain('binary search')
  })

  it('Feature 4: Generates clean context snippets for results', async () => {
    vi.spyOn(aiService, 'generateEmbedding').mockResolvedValueOnce(null) // keyword fallback

    const candidates = [
      {
        id: 'doubt-snippets',
        title: 'Dijkstra shortest path algorithm',
        content: 'I want to find the shortest path in a graph with non-negative weights using Dijkstra algorithm.',
        isResolved: true,
        acceptedAnswerId: 'ans-verified',
        acceptedAnswer: {
          id: 'ans-verified',
          content: 'Initialize dist array with infinity. Use priority queue with min-heap.'
        },
        aiAnswer: 'Dijkstra solves single-source shortest path problems in O((V + E) log V).',
        subjectId: 'sub-cs',
        subject: { id: 'sub-cs', name: 'Algorithms', code: 'CS202' },
        createdAt: new Date(),
        embedding: null
      }
    ]

    vi.mocked(prisma.doubt.findMany).mockResolvedValueOnce(candidates as any)

    const res = await searchDoubts({ q: 'Dijkstra' })
    expect(res.searchMode).toBe('keyword_fallback')
    expect(res.items[0].contentSnippet).toContain('Dijkstra')
    expect(res.items[0].acceptedAnswerSnippet).toContain('dist array')
    expect(res.items[0].faqSnippet).toContain('single-source')
  })

  it('Feature 7: Gracefully falls back to keyword ranking if Gemini fails or is rate-limited', async () => {
    vi.spyOn(aiService, 'generateEmbedding').mockRejectedValueOnce(new Error('429 Quota Exceeded'))

    const candidates = [
      {
        id: 'doubt-fallback',
        title: 'Recursive Tree Traversal',
        content: 'Preorder, Inorder, and Postorder tree traversal methods explained.',
        isResolved: true,
        acceptedAnswerId: null,
        acceptedAnswer: null,
        aiAnswer: null,
        subjectId: 'sub-1',
        createdAt: new Date(),
        embedding: null
      }
    ]

    vi.mocked(prisma.doubt.findMany).mockResolvedValueOnce(candidates as any)

    const res = await searchDoubts({ q: 'Tree Traversal' })
    expect(res.searchMode).toBe('keyword_fallback')
    expect(res.items).toHaveLength(1)
    expect(res.items[0].matchType).toBe('keyword')
  })

  it('Feature 6 & Reliability: Rejects comparison between incompatible vector dimensions', async () => {
    // Query is 3072 dims
    const queryVector = new Array(3072).fill(0.01)
    vi.spyOn(aiService, 'generateEmbedding').mockResolvedValueOnce(queryVector)

    // Stored candidate vector has incompatible dimensions (e.g. 768 or 1536)
    const incompatibleVector = new Array(768).fill(0.01)

    const candidates = [
      {
        id: 'doubt-incompatible',
        title: 'Dynamic Programming memoization',
        content: 'Fibonacci using top-down memoization',
        isResolved: true,
        acceptedAnswerId: null,
        acceptedAnswer: null,
        aiAnswer: null,
        subjectId: 'sub-1',
        createdAt: new Date(),
        embedding: { vector: incompatibleVector }
      }
    ]

    vi.mocked(prisma.doubt.findMany).mockResolvedValueOnce(candidates as any)

    const res = await searchDoubts({ q: 'Dynamic Programming' })
    // Should NOT compute cosine similarity with mismatched dimensions; defaults to keyword matching
    expect(res.items[0].matchType).toBe('keyword')
    expect(res.items[0].semanticSimilarity).toBeUndefined()
  })
})
