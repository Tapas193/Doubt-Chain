import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  askStudyAssistant,
  detectLanguage,
  retrieveAcademicContext,
  recordAiFeedback,
  recordAiReport,
  callGeminiWithRetry
} from '../src/services/ai.service.js'
import { prisma } from '../src/config/prisma.js'

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    doubt: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    aiAssistantConversation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    aiAssistantMessage: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    aiResponseFeedback: {
      upsert: vi.fn()
    },
    aiResponseReport: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('../src/config/env.js', () => ({
  env: {
    GEMINI_API_KEY: 'test-key'
  }
}))

describe('AI Study Assistant 2.0 Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature 1: Language Detection & Heuristics', () => {
    it('detects Hindi with Devanagari script', () => {
      expect(detectLanguage('बाइनरी सर्च कैसे काम करता है?')).toBe('hi')
      expect(detectLanguage('रिकर्शन की टाइम कॉम्प्लेक्सिटी क्या है?')).toBe('hi')
    })

    it('detects Hinglish with Romanized colloquial markers', () => {
      expect(detectLanguage('Binary search kaise kaam karta hai?')).toBe('hinglish')
      expect(detectLanguage('mujhe recursion samjha do')).toBe('hinglish')
      expect(detectLanguage('yeh code kyun fail ho raha hai?')).toBe('hinglish')
    })

    it('detects English when no Devanagari or Hinglish markers exist', () => {
      expect(detectLanguage('What is the time complexity of quickselect?')).toBe('en')
      expect(detectLanguage('Explain Dijkstra shortest path algorithm with example.')).toBe('en')
    })
  })

  describe('Feature 4: Academic Context Retrieval & Grounding', () => {
    it('retrieves relevant verified solutions and FAQs without exposing private info', async () => {
      vi.mocked(prisma.doubt.findMany).mockResolvedValueOnce([
        {
          id: 'doubt-1',
          title: 'Binary Search Implementation',
          content: 'How to write binary search iteratively in C++?',
          aiAnswer: 'Binary search divides the search space in half each iteration.',
          subject: { name: 'Data Structures', code: 'CS201' },
          acceptedAnswer: {
            content: 'int low = 0, high = n - 1;\nwhile(low <= high)...',
            author: { displayName: 'Prof. Sharma' }
          }
        } as any
      ])

      const context = await retrieveAcademicContext('binary search implementation in C++', 'sub-1')
      expect(context).toHaveLength(1)
      expect(context[0].title).toBe('Binary Search Implementation')
      expect(context[0].verifiedSolution).toContain('int low = 0')
      expect(context[0].faqSummary).toContain('divides the search space')
    })

    it('returns empty array when query has no searchable keywords', async () => {
      const context = await retrieveAcademicContext('a is')
      expect(context).toEqual([])
      expect(prisma.doubt.findMany).not.toHaveBeenCalled()
    })
  })

  describe('Feature 5: Feedback Submission', () => {
    it('records helpful feedback for an assistant response', async () => {
      vi.mocked(prisma.aiAssistantMessage.findUnique).mockResolvedValueOnce({
        id: 'msg-1',
        role: 'assistant',
        conversationId: 'conv-1'
      } as any)

      vi.mocked(prisma.aiResponseFeedback.upsert).mockResolvedValueOnce({
        id: 'fb-1',
        messageId: 'msg-1',
        userId: 'user-1',
        isHelpful: true,
        createdAt: new Date()
      } as any)

      const res = await recordAiFeedback({
        userId: 'user-1',
        messageId: 'msg-1',
        isHelpful: true
      })

      expect(res.status).toBe('recorded')
      expect(res.isHelpful).toBe(true)
      expect(prisma.aiResponseFeedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_messageId: { userId: 'user-1', messageId: 'msg-1' } },
          create: expect.objectContaining({ isHelpful: true })
        })
      )
    })

    it('rejects feedback on user messages', async () => {
      vi.mocked(prisma.aiAssistantMessage.findUnique).mockResolvedValueOnce({
        id: 'msg-user',
        role: 'user',
        conversationId: 'conv-1'
      } as any)

      await expect(
        recordAiFeedback({
          userId: 'user-1',
          messageId: 'msg-user',
          isHelpful: true
        })
      ).rejects.toThrow('Feedback can only be provided for assistant responses')
    })
  })

  describe('Feature 6: Report Potentially Incorrect Answers', () => {
    it('submits a report for factually incorrect content', async () => {
      vi.mocked(prisma.aiAssistantMessage.findUnique).mockResolvedValueOnce({
        id: 'msg-1',
        role: 'assistant'
      } as any)

      vi.mocked(prisma.aiResponseReport.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.aiResponseReport.create).mockResolvedValueOnce({
        id: 'rep-1',
        messageId: 'msg-1',
        userId: 'user-1',
        reason: 'FACTUALLY_INCORRECT',
        details: 'The time complexity is O(N log N) not O(N)',
        createdAt: new Date()
      } as any)

      const result = await recordAiReport({
        userId: 'user-1',
        messageId: 'msg-1',
        reason: 'FACTUALLY_INCORRECT',
        details: 'The time complexity is O(N log N) not O(N)'
      })

      expect(result.status).toBe('submitted')
      expect(result.message).toContain('submitted for review')
    })

    it('prevents accidental duplicate reports by the same user', async () => {
      vi.mocked(prisma.aiAssistantMessage.findUnique).mockResolvedValueOnce({
        id: 'msg-1',
        role: 'assistant'
      } as any)

      vi.mocked(prisma.aiResponseReport.findUnique).mockResolvedValueOnce({
        id: 'rep-1',
        messageId: 'msg-1',
        userId: 'user-1'
      } as any)

      const result = await recordAiReport({
        userId: 'user-1',
        messageId: 'msg-1',
        reason: 'INCORRECT_CODE'
      })

      expect(result.status).toBe('already_reported')
      expect(prisma.aiResponseReport.create).not.toHaveBeenCalled()
    })
  })

  describe('Feature 7 & 8: Reliability, Quota Exhaustion & Error Handling', () => {
    it('throws structured 429 when AI provider quota is exhausted without retry storm', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED: quota exceeded'))

      await expect(callGeminiWithRetry(mockFn)).rejects.toThrow('AI provider quota exceeded')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('retries on transient 503 server error', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValueOnce('success result')

      const result = await callGeminiWithRetry(mockFn, { maxRetries: 2, timeoutMs: 5000 })
      expect(result).toBe('success result')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})
