import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  doubt: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn()
  },
  topicCluster: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn()
  },
  doubtTopicAssignment: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn()
  },
  doubtEmbedding: {
    findUnique: vi.fn(),
    upsert: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  },
  subject: {
    findMany: vi.fn(),
    findUnique: vi.fn()
  },
  subjectMember: {
    findMany: vi.fn()
  },
  answer: {
    findMany: vi.fn()
  }
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))
vi.mock('../src/utils/jwt.js', () => ({
  verifyToken: vi.fn((token: string) => {
    if (token === 'valid-student-token') return { userId: 'stu-1', email: 'student@example.com' }
    if (token === 'valid-prof-token') return { userId: 'prof-1', email: 'professor@example.com' }
    if (token === 'valid-admin-token') return { userId: 'admin-1', email: 'dean@college.edu' }
    return null
  }),
  signToken: vi.fn(() => 'mock-jwt-token')
}))
vi.mock('../src/services/ai.service.js', () => ({
  generateEmbedding: vi.fn(),
  cosineSimilarity: vi.fn((a, b) => {
    if (!a || !b || a.length !== b.length) return 0
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }
    const den = Math.sqrt(magA) * Math.sqrt(magB)
    return den === 0 ? 0 : dot / den
  }),
  computeContentHash: vi.fn(() => 'test-content-hash')
}))

import {
  normalizeTopicName,
  assignDoubtToTopicCluster,
  getAnalyticsSummary,
  getMostAskedTopics,
  getDoubtTrends,
  getSubjectWiseStats,
  getSimilarDoubtClusters,
  getActionableAcademicInsights,
  SIMILARITY_THRESHOLD
} from '../src/services/analytics.service.js'
import { requireFacultyOrAdmin } from '../src/middleware/auth.js'

describe('Student Doubt Analytics & Semantic Topic Grouping Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.doubt.findMany.mockResolvedValue([])
    prismaMock.doubtTopicAssignment.findMany.mockResolvedValue([])
    prismaMock.topicCluster.findMany.mockResolvedValue([])
    prismaMock.answer.findMany.mockResolvedValue([])
    prismaMock.subject.findMany.mockResolvedValue([])
  })

  describe('Feature 1: Topic Normalization & Semantic Grouping', () => {
    it('normalizes common computer science terms into canonical topics', () => {
      expect(normalizeTopicName('How does JWT authentication work?', 'Content about tokens')).toBe('JWT Authentication')
      expect(normalizeTopicName('Why do we need Red-Black Tree rotation?', 'Balancing BST')).toBe('Red-Black Trees')
      expect(normalizeTopicName('Difference between inner join and left outer join in SQL', '')).toBe('SQL Joins & Relational Queries')
      expect(normalizeTopicName('Explain Banker algorithm for deadlock prevention', '')).toBe('Process Synchronization & Deadlocks')
      expect(normalizeTopicName('Time complexity of Dijkstra algorithm', '')).toBe('Shortest Path Algorithms')
    })

    it('handles multilingual questions (Hinglish & Hindi) accurately', () => {
      expect(normalizeTopicName('JWT token kaise verify karte hain?', 'Auth header check')).toBe('JWT Authentication')
      expect(normalizeTopicName('Red-black tree rotation ki zaroorat kyu hai?', '')).toBe('Red-Black Trees')
      expect(normalizeTopicName('Binary search tree me inorder traversal kaise hota hai?', '')).toBe('Binary Search Trees')
    })

    it('assigns doubt to existing cluster if cosine similarity >= threshold', async () => {
      const { cosineSimilarity } = await import('../src/services/ai.service.js')
      vi.mocked(cosineSimilarity).mockReturnValueOnce(0.88)

      prismaMock.doubt.findUnique.mockResolvedValueOnce({
        id: 'doubt-1',
        title: 'What is JWT auth?',
        content: 'Explaining token auth',
        subjectId: 'sub-1',
        embedding: { vector: [0.1, 0.2, 0.3] },
        topicAssignment: null
      } as any)

      prismaMock.topicCluster.findMany.mockResolvedValueOnce([
        {
          id: 'cluster-jwt',
          name: 'JWT Authentication',
          subjectId: 'sub-1',
          vector: [0.1, 0.2, 0.31]
        }
      ] as any)

      prismaMock.doubtTopicAssignment.create.mockResolvedValueOnce({
        id: 'assign-1',
        doubtId: 'doubt-1',
        topicId: 'cluster-jwt',
        similarity: 0.88
      } as any)

      const result = await assignDoubtToTopicCluster('doubt-1')
      expect(result.topicId).toBe('cluster-jwt')
      expect(result.similarity).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
      expect(prismaMock.topicCluster.create).not.toHaveBeenCalled()
    })

    it('creates new TopicCluster when similarity is below threshold', async () => {
      const { cosineSimilarity } = await import('../src/services/ai.service.js')
      vi.mocked(cosineSimilarity).mockReturnValue(0.42) // Below 0.78 threshold

      prismaMock.doubt.findUnique.mockResolvedValueOnce({
        id: 'doubt-2',
        title: 'How does SQL Join work?',
        content: 'Left join explanation',
        subjectId: 'sub-dbms',
        embedding: { vector: [0.9, 0.1, 0.0] },
        topicAssignment: null
      } as any)

      prismaMock.topicCluster.findMany.mockResolvedValueOnce([
        {
          id: 'cluster-other',
          name: 'Process Synchronization & Deadlocks',
          subjectId: 'sub-dbms',
          vector: [0.1, 0.2, 0.3]
        }
      ] as any)

      prismaMock.topicCluster.create.mockResolvedValueOnce({
        id: 'cluster-sql',
        name: 'SQL Joins & Relational Queries',
        subjectId: 'sub-dbms',
        vector: [0.9, 0.1, 0.0]
      } as any)

      prismaMock.doubtTopicAssignment.create.mockResolvedValueOnce({
        id: 'assign-2',
        doubtId: 'doubt-2',
        topicId: 'cluster-sql',
        similarity: 1.0
      } as any)

      const result = await assignDoubtToTopicCluster('doubt-2')
      expect(prismaMock.topicCluster.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'SQL Joins & Relational Queries',
          subjectId: 'sub-dbms'
        })
      })
      expect(result.topicId).toBe('cluster-sql')
    })

    it('prevents duplicate processing if doubt is already assigned', async () => {
      prismaMock.doubt.findUnique.mockResolvedValueOnce({
        id: 'doubt-assigned',
        title: 'Already assigned doubt',
        content: 'Content',
        topicAssignment: { id: 'existing-assign', topicId: 'cluster-1' }
      } as any)

      const result = await assignDoubtToTopicCluster('doubt-assigned')
      expect(result.id).toBe('existing-assign')
      expect(prismaMock.topicCluster.create).not.toHaveBeenCalled()
      expect(prismaMock.doubtTopicAssignment.create).not.toHaveBeenCalled()
    })
  })

  describe('Feature 2: Analytics Aggregation & Real Metrics Calculation', () => {
    const adminUser = { userId: 'admin-1', email: 'admin@college.edu', role: 'ADMIN' }

    it('calculates summary metrics accurately from real database records', async () => {
      prismaMock.doubt.count.mockResolvedValueOnce(45) // total doubts
      prismaMock.doubtTopicAssignment.findMany.mockResolvedValueOnce([
        { topicId: 'top-1' },
        { topicId: 'top-2' },
        { topicId: 'top-3' }
      ] as any) // 3 distinct topics
      prismaMock.doubtTopicAssignment.groupBy.mockResolvedValueOnce([
        { topicId: 'top-1', _count: { doubtId: 18 } }
      ] as any)
      prismaMock.topicCluster.findUnique.mockResolvedValueOnce({
        name: 'Binary Search Trees'
      } as any)
      prismaMock.doubtTopicAssignment.groupBy.mockResolvedValueOnce([
        { topicId: 'top-1', _count: { doubtId: 8 } }
      ] as any) // 8 repeated doubts
      prismaMock.answer.findMany.mockResolvedValueOnce([
        { id: 'ans-1', upvotes: [{ id: 'up-1' }], doubt: { acceptedAnswerId: 'ans-1' } },
        { id: 'ans-2', upvotes: [], doubt: { acceptedAnswerId: null } }
      ] as any) // 1 out of 2 helpful = 50%

      const summary = await getAnalyticsSummary({}, adminUser)
      expect(summary.totalDoubts).toBe(45)
      expect(summary.distinctTopics).toBe(3)
      expect(summary.topTopic).toBe('Binary Search Trees')
      expect(summary.topTopicCount).toBe(18)
      expect(summary.repeatedDoubtsCount).toBe(8)
      expect(summary.helpfulnessRate).toBe(50)
    })

    it('returns empty/zero states without errors when no doubts exist', async () => {
      prismaMock.doubt.count.mockResolvedValueOnce(0)
      prismaMock.doubtTopicAssignment.findMany.mockResolvedValueOnce([])
      prismaMock.doubtTopicAssignment.groupBy.mockResolvedValueOnce([])
      prismaMock.doubtTopicAssignment.groupBy.mockResolvedValueOnce([])
      prismaMock.answer.findMany.mockResolvedValueOnce([])

      const summary = await getAnalyticsSummary({}, adminUser)
      expect(summary.totalDoubts).toBe(0)
      expect(summary.distinctTopics).toBe(0)
      expect(summary.topTopic).toBe('None')
      expect(summary.topTopicCount).toBe(0)
      expect(summary.repeatedDoubtsCount).toBe(0)
      expect(summary.helpfulnessRate).toBe(0)
    })

    it('aggregates doubt volume trends over daily timeline buckets', async () => {
      prismaMock.doubt.findMany.mockImplementation((args: any) => {
        if (args?.where?.topicAssignment === null) {
          return Promise.resolve([])
        }
        return Promise.resolve([
          { id: 'd-1', createdAt: new Date('2026-10-20T10:00:00Z') },
          { id: 'd-2', createdAt: new Date('2026-10-20T15:30:00Z') },
          { id: 'd-3', createdAt: new Date('2026-10-22T08:00:00Z') }
        ])
      })

      const result = await getDoubtTrends({
        startDate: '2026-10-20T00:00:00Z',
        endDate: '2026-10-23T00:00:00Z'
      }, adminUser)

      expect(result.totalCount).toBe(3)
      expect(result.trends.length).toBeGreaterThanOrEqual(3)
      const oct20 = result.trends.find(t => t.date === '2026-10-20')
      expect(oct20?.count).toBe(2)
      const oct22 = result.trends.find(t => t.date === '2026-10-22')
      expect(oct22?.count).toBe(1)
    })

    it('calculates subject-wise counts and percentage change vs prior period', async () => {
      prismaMock.doubt.groupBy.mockResolvedValueOnce([
        { subjectId: 'sub-os', _count: { id: 20 } }
      ] as any)
      prismaMock.doubt.groupBy.mockResolvedValueOnce([
        { subjectId: 'sub-os', _count: { id: 10 } }
      ] as any) // prior was 10, current is 20 -> +100% change
      prismaMock.subject.findMany.mockResolvedValueOnce([
        { id: 'sub-os', name: 'Operating Systems', code: 'CS301' }
      ] as any)
      prismaMock.doubtTopicAssignment.count.mockResolvedValueOnce(5)

      const stats = await getSubjectWiseStats({
        startDate: '2026-10-01T00:00:00Z',
        endDate: '2026-10-20T00:00:00Z'
      }, adminUser)

      expect(stats).toHaveLength(1)
      expect(stats[0].name).toBe('Operating Systems')
      expect(stats[0].currentCount).toBe(20)
      expect(stats[0].previousCount).toBe(10)
      expect(stats[0].percentageChange).toBe(100)
      expect(stats[0].topicsCount).toBe(5)
    })

    it('protects student privacy by not returning author identity in similar doubt clusters', async () => {
      prismaMock.topicCluster.findMany.mockResolvedValueOnce([
        {
          id: 'cluster-1',
          name: 'JWT Authentication',
          subject: { name: 'Web Engineering', code: 'CS401' },
          assignments: [
            {
              similarity: 0.95,
              doubt: {
                id: 'd-1',
                title: 'How does JWT auth work?',
                createdAt: new Date('2026-10-15T10:00:00Z')
              }
            },
            {
              similarity: 0.91,
              doubt: {
                id: 'd-2',
                title: 'Why use JWT tokens in React?',
                createdAt: new Date('2026-10-16T12:00:00Z')
              }
            }
          ]
        }
      ] as any)

      const clusters = await getSimilarDoubtClusters({}, adminUser)
      expect(clusters).toHaveLength(1)
      expect(clusters[0].topic).toBe('JWT Authentication')
      expect(clusters[0].doubtCount).toBe(2)
      expect(clusters[0].representativeQuestion).toBe('How does JWT auth work?')

      // Verify ZERO student PII fields exist
      const sample = clusters[0].sampleQuestions[0] as any
      expect(sample.author).toBeUndefined()
      expect(sample.authorId).toBeUndefined()
      expect(sample.email).toBeUndefined()
      expect(sample.userId).toBeUndefined()
      expect(sample.studentId).toBeUndefined()
    })
  })

  describe('Feature 3: Actionable Academic Insights Generation', () => {
    const adminUser = { userId: 'admin-1', email: 'admin@college.edu', role: 'ADMIN' }

    it('returns empty insights and hasData: false when dataset is empty', async () => {
      prismaMock.doubt.count.mockResolvedValueOnce(0)
      const result = await getActionableAcademicInsights({}, adminUser)
      expect(result.hasData).toBe(false)
      expect(result.insights).toEqual([])
    })

    it('produces repetition warning when a topic has >= 3 similar questions', async () => {
      prismaMock.doubt.count.mockResolvedValue(10)
      prismaMock.doubtTopicAssignment.groupBy.mockResolvedValue([
        { topicId: 'top-1', _count: { doubtId: 4 } }
      ] as any)
      prismaMock.topicCluster.findMany.mockResolvedValue([
        {
          id: 'c-repeat',
          name: 'Binary Search Trees',
          subject: { name: 'Data Structures', code: 'CS201' },
          assignments: [
            { similarity: 0.9, doubt: { id: 'd-1', title: 'BST traversal doubt', createdAt: new Date() } },
            { similarity: 0.9, doubt: { id: 'd-2', title: 'BST traversal order', createdAt: new Date() } },
            { similarity: 0.85, doubt: { id: 'd-3', title: 'Inorder BST logic', createdAt: new Date() } }
          ]
        }
      ] as any)
      prismaMock.topicCluster.findUnique.mockResolvedValue({
        id: 'top-1',
        name: 'Binary Search Trees',
        subject: { name: 'Data Structures', code: 'CS201' }
      } as any)
      prismaMock.doubt.groupBy.mockResolvedValue([])
      prismaMock.subject.findMany.mockResolvedValue([])

      const { insights, hasData } = await getActionableAcademicInsights({}, adminUser)
      expect(hasData).toBe(true)
      const repeatInsight = insights.find(i => i.type === 'REPETITION_WARNING')
      expect(repeatInsight).toBeDefined()
      expect(repeatInsight?.topic).toBe('Binary Search Trees')
      expect(repeatInsight?.recommendation).toContain('verified FAQ walkthrough')
    })
  })

  describe('Feature 4: Role-Based Authorization & Access Control', () => {
    it('denies access to student users with 403 Forbidden', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'stu-1',
        email: 'student@example.com',
        profession: 'STUDENT',
        role: 'STUDENT'
      } as any)

      const req: any = {
        cookies: { token: 'valid-student-token' },
        headers: {}
      }
      const res: any = {}
      const next = vi.fn()

      await expect(requireFacultyOrAdmin(req, res, next)).rejects.toThrow('Forbidden: Student access restricted from institutional analytics')
      expect(next).not.toHaveBeenCalled()
    })

    it('allows faculty users with profession PROFESSOR', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'prof-1',
        email: 'professor@example.com',
        profession: 'PROFESSOR',
        role: 'FACULTY'
      } as any)

      const req: any = {
        cookies: { token: 'valid-prof-token' },
        headers: {}
      }
      const res: any = {}
      const next = vi.fn()

      await requireFacultyOrAdmin(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req.user.role).toBe('FACULTY')
    })

    it('allows college administrators with role ADMIN', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'dean@college.edu',
        profession: 'PROFESSOR',
        role: 'ADMIN'
      } as any)

      const req: any = {
        cookies: { token: 'valid-admin-token' },
        headers: {}
      }
      const res: any = {}
      const next = vi.fn()

      await requireFacultyOrAdmin(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(req.user.role).toBe('ADMIN')
    })
  })
})
