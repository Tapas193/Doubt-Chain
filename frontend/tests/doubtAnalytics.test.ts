import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doubtService } from '../src/services/doubtService'
import { api } from '../src/lib/apiClient'

vi.mock('../src/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn()
  }
}))

describe('Student Doubt Analytics Service & Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches analytics summary with date range and subject filter', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      totalDoubts: 42,
      distinctTopics: 6,
      topTopic: 'JWT Authentication',
      topTopicCount: 15,
      repeatedDoubtsCount: 8,
      helpfulnessRate: 75,
      dateRange: {
        start: '2026-10-01T00:00:00.000Z',
        end: '2026-10-28T00:00:00.000Z'
      }
    })

    const res = await doubtService.getAnalyticsSummary({
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-28T00:00:00.000Z',
      subjectId: 'sub-web'
    })

    expect(api.get).toHaveBeenCalledWith(
      '/analytics/summary?startDate=2026-10-01T00%3A00%3A00.000Z&endDate=2026-10-28T00%3A00%3A00.000Z&subjectId=sub-web'
    )
    expect(res.totalDoubts).toBe(42)
    expect(res.topTopic).toBe('JWT Authentication')
    expect(res.helpfulnessRate).toBe(75)
  })

  it('fetches most asked topics with custom limit', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'cluster-1',
        name: 'Binary Search Trees',
        doubtCount: 20,
        percentageOfTotal: 50,
        representativeQuestion: 'How to balance an AVL tree?',
        subject: { id: 'sub-ds', name: 'Data Structures', code: 'CS201' }
      }
    ])

    const res = await doubtService.getMostAskedTopics({ limit: 5 })
    expect(api.get).toHaveBeenCalledWith('/analytics/topics?limit=5')
    expect(res).toHaveLength(1)
    expect(res[0].name).toBe('Binary Search Trees')
    expect(res[0].percentageOfTotal).toBe(50)
  })

  it('fetches timeline trends with weekly granularity', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      granularity: 'week',
      trends: [
        { date: '2026-W40', count: 12 },
        { date: '2026-W41', count: 18 }
      ],
      totalCount: 30
    })

    const res = await doubtService.getDoubtTrends({ granularity: 'week' })
    expect(api.get).toHaveBeenCalledWith('/analytics/trends?granularity=week')
    expect(res.granularity).toBe('week')
    expect(res.totalCount).toBe(30)
    expect(res.trends[1].count).toBe(18)
  })

  it('fetches subject-wise metrics and period delta', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        subjectId: 'sub-os',
        name: 'Operating Systems',
        code: 'CS301',
        currentCount: 30,
        previousCount: 15,
        percentageChange: 100,
        topicsCount: 4
      }
    ])

    const res = await doubtService.getSubjectWiseStats()
    expect(api.get).toHaveBeenCalledWith('/analytics/subjects')
    expect(res[0].name).toBe('Operating Systems')
    expect(res[0].percentageChange).toBe(100)
  })

  it('fetches similar question clusters with zero student PII', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'cluster-jwt',
        topicName: 'JWT Authentication',
        doubtCount: 5,
        representativeQuestion: 'How does token validation work in JWT?',
        sampleDoubts: [
          { id: 'd-1', title: 'JWT token invalid error', createdAt: '2026-10-25T10:00:00Z' }
        ]
      }
    ])

    const res = await doubtService.getSimilarClusters({ limit: 4 })
    expect(api.get).toHaveBeenCalledWith('/analytics/clusters?limit=4')
    expect(res[0].sampleDoubts[0]).not.toHaveProperty('author')
    expect(res[0].sampleDoubts[0]).not.toHaveProperty('studentEmail')
    expect(res[0].sampleDoubts[0].title).toBe('JWT token invalid error')
  })

  it('fetches actionable academic insights derived from aggregate data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'spike-jwt',
        type: 'SPIKE',
        severity: 'high',
        title: 'Surge in Doubts for JWT Authentication',
        observation: 'Received 15 doubts in current period compared to 4 in previous period (+275%).',
        actionSuggestion: 'Consider reviewing token validation and security headers during next lab.'
      }
    ])

    const res = await doubtService.getActionableInsights({ subjectId: 'sub-web' })
    expect(api.get).toHaveBeenCalledWith('/analytics/insights?subjectId=sub-web')
    expect(res[0].type).toBe('SPIKE')
    expect(res[0].severity).toBe('high')
    expect(res[0].observation).toContain('+275%')
  })
})
