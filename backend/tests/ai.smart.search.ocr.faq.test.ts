import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  doubt: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn()
  },
  doubtEmbedding: {
    findUnique: vi.fn(),
    upsert: vi.fn()
  },
  searchFeedback: {
    findFirst: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn()
  },
  attachment: {
    createMany: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

// Mock AI service
const aiMock = vi.hoisted(() => ({
  generateEmbedding: vi.fn(),
  cosineSimilarity: vi.fn(),
  computeContentHash: vi.fn((pieces: any[]) => pieces.filter(Boolean).join(':::')),
  generateFaqFromAcceptedAnswer: vi.fn()
}))

vi.mock('../src/services/ai.service.js', () => aiMock)

import {
  findSmartDuplicates,
  recordSearchFeedback,
  searchDoubts,
  reopenDoubt
} from '../src/services/doubt.service.js'

describe('Features: Smart Duplicate Detection, OCR/Audio Search & AI FAQ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (op: any) => op(prismaMock))
  })

  describe('Feature 1: Smart Duplicate Detection', () => {
    const candidateDoubts = [
      {
        id: 'doubt-bst',
        title: 'Binary search tree rotations and balancing',
        content: 'Explaining left and right rotations in AVL and BST.',
        isResolved: true,
        subjectId: 'sub-cs201',
        subject: { id: 'sub-cs201', name: 'Data Structures', code: 'CS201' },
        acceptedAnswer: {
          id: 'ans-1',
          content: 'Rotate left when right child is heavy.',
          author: { id: 'u-1', username: 'tutor1', displayName: 'Tutor 1' }
        },
        attachments: [],
        embedding: {
          vector: [0.9, 0.1, 0.0],
          contentHash: 'hash-bst'
        }
      },
      {
        id: 'doubt-pasta',
        title: 'How to boil pasta properly',
        content: 'Water temperature and salt guidelines.',
        isResolved: true,
        subjectId: 'sub-cooking',
        subject: { id: 'sub-cooking', name: 'Culinary', code: 'COOK101' },
        acceptedAnswer: {
          id: 'ans-2',
          content: 'Add salt to rolling boiling water.',
          author: { id: 'u-2', username: 'chef', displayName: 'Chef' }
        },
        attachments: [],
        embedding: {
          vector: [0.1, 0.9, 0.0],
          contentHash: 'hash-pasta'
        }
      }
    ]

    it('returns semantically similar resolved doubts and excludes unrelated ones', async () => {
      aiMock.generateEmbedding.mockImplementation(async (text: string) => {
        if (text.toLowerCase().includes('pasta') || text.toLowerCase().includes('boil')) {
          return [0.1, 0.9, 0.0]
        }
        return [0.88, 0.12, 0.0]
      })
      aiMock.cosineSimilarity.mockImplementation((_q: number[], v: number[]) => {
        if (v[0] > 0.5) return 0.89
        return 0.35
      })

      prismaMock.doubt.findMany.mockResolvedValue(candidateDoubts)

      const results = await findSmartDuplicates({
        q: 'How to rotate and balance a binary tree?',
        threshold: 0.65,
        limit: 3
      })

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doubt-bst')
      expect(results[0].similarity).toBe(0.89)
      expect(results[0].similarityPercent).toBe(89)
      expect(results[0].acceptedAnswer?.content).toBe('Rotate left when right child is heavy.')
      expect(results[0].discussionUrl).toBe('/doubts/doubt-bst')
    })

    it('respects subject filter', async () => {
      aiMock.generateEmbedding.mockResolvedValue([0.88, 0.12, 0.0])
      prismaMock.doubt.findMany.mockResolvedValue([])

      await findSmartDuplicates({
        q: 'tree rotation',
        subjectId: 'sub-cs201'
      })

      expect(prismaMock.doubt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isResolved: true,
            subjectId: 'sub-cs201'
          })
        })
      )
    })

    it('falls back to keyword matching if embedding provider is unavailable or fails', async () => {
      // Embedding fails
      aiMock.generateEmbedding.mockResolvedValue(null)
      prismaMock.doubt.findMany.mockResolvedValue(candidateDoubts)

      const results = await findSmartDuplicates({
        q: 'binary search tree balancing',
        limit: 3
      })

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('doubt-bst')
      expect(results[0].matchType).toBe('keyword_fallback')
    })
  })

  describe('Feature 1 Interaction Tracking: Search Feedback', () => {
    it('records user feedback idempotently', async () => {
      prismaMock.searchFeedback.findFirst.mockResolvedValue(null)
      prismaMock.searchFeedback.create.mockResolvedValue({
        id: 'fb-1',
        userId: 'student-1',
        doubtId: 'doubt-bst',
        action: 'ANSWERED_MY_DOUBT',
        query: 'tree rotation'
      } as any)

      const res = await recordSearchFeedback({
        userId: 'student-1',
        doubtId: 'doubt-bst',
        action: 'ANSWERED_MY_DOUBT',
        query: 'Tree Rotation'
      })

      expect(prismaMock.searchFeedback.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-1',
          doubtId: 'doubt-bst',
          action: 'ANSWERED_MY_DOUBT',
          query: 'tree rotation'
        }
      })
      expect(res.id).toBe('fb-1')
    })
  })

  describe('Feature 2 & 3: OCR and Voice Transcription Searchability', () => {
    it('finds doubts where extracted image OCR text or audio transcript matches query', async () => {
      prismaMock.doubt.findMany.mockResolvedValue([
        {
          id: 'doubt-ocr',
          title: 'Problem set question 3',
          content: 'See attached diagram',
          attachments: [{ extractedText: 'Deadlock avoidance using Banker algorithm' }]
        }
      ])
      prismaMock.doubt.count.mockResolvedValue(1)

      const result = await searchDoubts({ q: 'Banker algorithm' })

      expect(prismaMock.doubt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                attachments: {
                  some: {
                    extractedText: { contains: 'Banker algorithm', mode: 'insensitive' }
                  }
                }
              }
            ])
          })
        })
      )
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('doubt-ocr')
    })
  })

  describe('Feature 4: AI FAQ Generation & Reopening State', () => {
    it('reopening a doubt clears AI FAQ fields alongside accepted answer', async () => {
      prismaMock.doubt.findUnique.mockResolvedValue({
        id: 'd-1',
        authorId: 'user-1',
        isResolved: true,
        acceptedAnswerId: 'ans-1',
        aiQuestion: 'What is AVL rotation?',
        aiAnswer: 'An AVL rotation restores tree balance.'
      })
      prismaMock.doubt.update.mockResolvedValue({
        id: 'd-1',
        isResolved: false,
        acceptedAnswerId: null,
        aiQuestion: null,
        aiAnswer: null,
        aiTags: []
      })

      await reopenDoubt('d-1', 'user-1')

      expect(prismaMock.doubt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isResolved: false,
            acceptedAnswerId: null,
            aiQuestion: null,
            aiAnswer: null,
            aiTags: []
          })
        })
      )
    })
  })
})
