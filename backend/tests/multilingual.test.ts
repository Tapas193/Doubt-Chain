import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  contentTranslation: {
    findUnique: vi.fn(),
    upsert: vi.fn()
  },
  user: {
    update: vi.fn(),
    findUnique: vi.fn()
  },
  doubt: {
    findMany: vi.fn()
  },
  doubtEmbedding: {
    findUnique: vi.fn()
  }
}))

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }))

import { translateContent, cosineSimilarity } from '../src/services/ai.service.js'
import { updateLanguagePreference } from '../src/services/auth.service.js'

describe('Multilingual Services & Cross-Language Retrieval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Content Translation & DB Caching', () => {
    it('returns cached translation immediately if found in database', async () => {
      prismaMock.contentTranslation.findUnique.mockResolvedValueOnce({
        id: 'trans-1',
        sourceHash: 'somehash',
        targetLang: 'hi',
        sourceLang: 'en',
        translatedText: 'बाइनरी सर्च एक कुशल खोज एल्गोरिथ्म है।'
      })

      const res = await translateContent({
        text: 'Binary search is an efficient searching algorithm.',
        targetLang: 'hi'
      })

      expect(res.fromCache).toBe(true)
      expect(res.targetLang).toBe('hi')
      expect(res.translatedText).toBe('बाइनरी सर्च एक कुशल खोज एल्गोरिथ्म है।')
      expect(prismaMock.contentTranslation.findUnique).toHaveBeenCalledTimes(1)
    })

    it('handles empty translation input gracefully without errors', async () => {
      const res = await translateContent({ text: '', targetLang: 'hi' })
      expect(res.translatedText).toBe('')
      expect(res.targetLang).toBe('hi')
    })

  })

  describe('User Language Preferences Synchronization', () => {
    it('updates preferred language in user record', async () => {
      prismaMock.user.update.mockResolvedValueOnce({
        id: 'u-123',
        email: 'student@example.com',
        username: 'student',
        displayName: 'Student',
        fullName: 'Student Name',
        profession: 'STUDENT',
        identificationNumber: 'STU123',
        preferredLanguage: 'hi',
        createdAt: new Date()
      })

      const updated = await updateLanguagePreference('u-123', 'hi')

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u-123' },
        data: { preferredLanguage: 'hi' },
        select: expect.objectContaining({
          preferredLanguage: true
        })
      })
      expect(updated.preferredLanguage).toBe('hi')
    })
  })

  describe('Cross-Language Semantic Similarity Vector Calculation', () => {
    it('computes high similarity for equivalent semantic vectors across languages', () => {
      // Simulating normalized vector embeddings from gemini-embedding-001
      const enVector = [0.25, 0.5, 0.7, 0.1, 0.4]
      // Highly correlated vector representing equivalent Hindi/Hinglish query
      const hiVector = [0.24, 0.49, 0.71, 0.11, 0.39]
      // Orthogonal/unrelated vector
      const unrelatedVector = [-0.6, 0.1, -0.2, 0.7, 0.1]

      const hiSimilarity = cosineSimilarity(enVector, hiVector)
      const unrelatedSimilarity = cosineSimilarity(enVector, unrelatedVector)

      expect(hiSimilarity).toBeGreaterThan(0.98)
      expect(unrelatedSimilarity).toBeLessThan(0.3)
    })
  })

  describe('Clean JSON Response & Translation Handling', () => {
    it('unwraps JSON translation objects cleanly', async () => {
      const { extractCleanTranslatedText } = await import('../src/services/ai.service.js')
      const raw = JSON.stringify({
        translatedText: 'Red-Black Tree mein Rotation ek technique hai jisse hum tree ko balance karte hain.',
        detectedSourceLang: 'hinglish'
      })
      const result = extractCleanTranslatedText(raw)
      expect(result.translatedText).toBe('Red-Black Tree mein Rotation ek technique hai jisse hum tree ko balance karte hain.')
      expect(result.detectedSourceLang).toBe('hinglish')
    })

    it('unwraps markdown-wrapped JSON code fences', async () => {
      const { extractCleanTranslatedText } = await import('../src/services/ai.service.js')
      const raw = '```json\n{\n  "translatedText": "Binary search O(log n) leta hai",\n  "detectedSourceLang": "en"\n}\n```'
      const result = extractCleanTranslatedText(raw)
      expect(result.translatedText).toBe('Binary search O(log n) leta hai')
      expect(result.detectedSourceLang).toBe('en')
    })

    it('recovers from unescaped newlines in Gemini JSON output', async () => {
      const { extractCleanTranslatedText } = await import('../src/services/ai.service.js')
      // Malformed JSON with literal raw newline inside string value
      const raw = '{\n  "translatedText": "Line 1 in Hinglish.\nLine 2 with code.",\n  "detectedSourceLang": "hinglish"\n}'
      const result = extractCleanTranslatedText(raw)
      expect(result.translatedText).toContain('Line 1 in Hinglish.')
      expect(result.translatedText).toContain('Line 2 with code.')
      expect(result.detectedSourceLang).toBe('hinglish')
    })

    it('unwraps JSON objects in AI Study Assistant explanations', async () => {
      const { extractCleanExplanation } = await import('../src/services/ai.service.js')
      const raw = JSON.stringify({
        translatedText: 'Red-Black Tree mein rotation ek technique hai.',
        detectedSourceLang: 'hinglish'
      })
      const clean = extractCleanExplanation(raw)
      expect(clean).toBe('Red-Black Tree mein rotation ek technique hai.')
    })

    it('preserves plain educational explanations unchanged', async () => {
      const { extractCleanExplanation } = await import('../src/services/ai.service.js')
      const text = 'Red-Black Tree mein Rotation ek technique hai jisse hum tree ko balance karte hain bina BST ki properties break kiye.'
      const clean = extractCleanExplanation(text)
      expect(clean).toBe(text)
    })
  })
})
