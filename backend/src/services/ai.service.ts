import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import crypto from 'crypto'
import { z } from 'zod'
import { env } from '../config/env.js'

export function getAiClient(): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

/**
 * Generate 3072-dimensional vector embedding for text using gemini-embedding-001.
 * Returns null if client is not configured or on network/API failure.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const ai = getAiClient()
  if (!ai) return null

  const cleanText = text.trim().slice(0, 8000)
  if (!cleanText) return null

  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: cleanText
    })

    const values = res.embeddings?.[0]?.values
    if (!values || !Array.isArray(values) || values.length === 0) {
      return null
    }

    return values
  } catch (err: any) {
    console.warn('[AI] Embedding generation failed (falling back to keyword matching):', err?.message || err)
    return null
  }
}

/**
 * Compute cosine similarity between two unit-normalized embedding vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dotProduct = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB)
  if (denominator === 0) return 0
  return dotProduct / denominator
}

/**
 * Hash content to detect changes and avoid redundant embedding generation.
 */
export function computeContentHash(pieces: (string | null | undefined)[]): string {
  const combined = pieces.filter(Boolean).map(p => p!.trim()).join(':::')
  return crypto.createHash('sha256').update(combined).digest('hex')
}

/**
 * Extract text from an image attachment using Gemini Vision OCR.
 * Preserves original image and extracts readable text, code, or handwritten notes.
 */
export async function extractTextFromImage(filePath: string, mimeType: string): Promise<string> {
  const ai = getAiClient()
  if (!ai) return ''

  try {
    if (!fs.existsSync(filePath)) return ''
    const buffer = await fs.promises.readFile(filePath)
    const base64Data = buffer.toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: base64Data
          }
        },
        'Extract all readable text, source code, math equations, or handwritten notes visible in this image. Output only the extracted text accurately. If there is no readable text, output [NO_TEXT].'
      ]
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    if (text.includes('[NO_TEXT]')) {
      return ''
    }
    return text
  } catch (err: any) {
    console.warn('[AI OCR] Vision text extraction failed:', err?.message || err)
    return ''
  }
}

/**
 * Transcribe speech from an audio attachment (supports English, Hindi, Hinglish).
 */
export async function transcribeAudio(filePath: string, mimeType: string): Promise<string> {
  const ai = getAiClient()
  if (!ai) return ''

  try {
    if (!fs.existsSync(filePath)) return ''
    const buffer = await fs.promises.readFile(filePath)
    const base64Data = buffer.toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: base64Data
          }
        },
        'Transcribe this audio recording accurately. If speech is spoken in Hindi, English, or Hinglish, output the exact words in Roman/English script as spoken. If the audio is silent or contains no speech, output [NO_SPEECH].'
      ]
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    if (text.includes('[NO_SPEECH]')) {
      return ''
    }
    return text
  } catch (err: any) {
    console.warn('[AI Transcription] Audio transcription failed:', err?.message || err)
    return ''
  }
}

const FaqOutputSchema = z.object({
  question: z.string().min(5).max(300),
  answer: z.string().min(10).max(4000),
  tags: z.array(z.string()).default([])
})

/**
 * Generate a clean FAQ question, clear answer, and tags grounded in the accepted answer.
 */
export async function generateFaqFromAcceptedAnswer(input: {
  doubtTitle: string
  doubtContent: string
  acceptedAnswerContent: string
  subjectName?: string
}): Promise<{ question: string; answer: string; tags: string[] } | null> {
  const ai = getAiClient()
  if (!ai) return null

  try {
    const prompt = `
You are the Doubt-Chain academic FAQ generator.
Based strictly on the original student doubt and the accepted solution provided below, generate an authoritative FAQ entry.

Subject: ${input.subjectName || 'General'}
Original Doubt Title: ${input.doubtTitle}
Original Doubt Details: ${input.doubtContent}
Accepted Answer: ${input.acceptedAnswerContent}

Rules:
1. "question": A concise, clear question stating the core problem.
2. "answer": A clear, well-structured explanation grounded entirely in the accepted answer. Do not hallucinate external facts.
3. "tags": 2 to 5 relevant lowercase topic tags (e.g. ["algorithms", "trees", "data-structures"]).
4. Return ONLY a valid JSON object matching: {"question": string, "answer": string, "tags": string[]}
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    const validated = FaqOutputSchema.safeParse(parsed)
    if (!validated.success) return null

    return validated.data
  } catch (err: any) {
    console.warn('[AI FAQ] FAQ generation failed:', err?.message || err)
    return null
  }
}

export async function askDoubtAssistant(input: {
  question: string
  subject?: string
  mode?: 'beginner' | 'step-by-step' | 'example' | 'hinglish' | 'debug'
}) {
  const ai = getAiClient()
  if (!ai) {
    throw new Error('GEMINI_API_KEY is missing in backend/.env')
  }

  const question = input.question.trim()
  if (!question) {
    throw new Error('Question cannot be empty')
  }

  const instructions = {
    beginner: 'Explain from the basics using simple language.',
    'step-by-step': 'Explain in numbered steps.',
    example: 'Explain with a practical example.',
    hinglish: 'Explain in simple Hinglish.',
    debug: 'Help debug the problem and explain the correction.'
  }

  const mode = input.mode ?? 'beginner'

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: `
You are the AI learning assistant for Doubt-Chain.

Subject: ${input.subject || 'General'}
Mode: ${mode}
Instructions: ${instructions[mode]}

Explain accurately and clearly. If uncertain, say so.
Label your response as AI-generated.

Student question:
${question}
`
  })

  const answer = response.text?.trim()
  if (!answer) {
    throw new Error('Gemini returned an empty response')
  }

  return answer
}