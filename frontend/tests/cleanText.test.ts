import { describe, it, expect } from 'vitest'
import { extractCleanText } from '../src/utils/cleanText'

describe('extractCleanText utility', () => {
  it('extracts translatedText from serialized JSON strings', () => {
    const rawJson = JSON.stringify({
      translatedText: 'Red-Black Tree mein Rotation ek technique hai jisse hum tree ko balance karte hain.',
      detectedSourceLang: 'hinglish'
    })
    const clean = extractCleanText(rawJson)
    expect(clean).toBe('Red-Black Tree mein Rotation ek technique hai jisse hum tree ko balance karte hain.')
  })

  it('extracts answer from serialized AI response JSON', () => {
    const rawJson = JSON.stringify({
      answer: 'Binary search ki time complexity O(log n) hoti hai.',
      language: 'hinglish'
    })
    const clean = extractCleanText(rawJson)
    expect(clean).toBe('Binary search ki time complexity O(log n) hoti hai.')
  })

  it('unwraps markdown-wrapped JSON code fences', () => {
    const fenced = '```json\n{\n  "translatedText": "Rotation restores tree balance."\n}\n```'
    const clean = extractCleanText(fenced)
    expect(clean).toBe('Rotation restores tree balance.')
  })

  it('recovers from unescaped newlines in JSON strings', () => {
    const malformed = '{\n  "translatedText": "Line 1 in Hinglish\nLine 2 with pointer",\n  "detectedSourceLang": "hinglish"\n}'
    const clean = extractCleanText(malformed)
    expect(clean).toContain('Line 1 in Hinglish')
    expect(clean).toContain('Line 2 with pointer')
  })

  it('handles object inputs directly', () => {
    const obj = {
      translatedText: 'Red-Black Tree balance karta hai.',
      detectedSourceLang: 'hinglish'
    }
    const clean = extractCleanText(obj)
    expect(clean).toBe('Red-Black Tree balance karta hai.')
  })

  it('leaves standard markdown educational content untouched', () => {
    const normal = '### Red-Black Tree Rotation\n\nRed-Black Tree mein Rotation ek technique hai.'
    const clean = extractCleanText(normal)
    expect(clean).toBe(normal)
  })

  it('handles empty or null gracefully', () => {
    expect(extractCleanText(null)).toBe('')
    expect(extractCleanText(undefined)).toBe('')
    expect(extractCleanText('')).toBe('')
  })
})
