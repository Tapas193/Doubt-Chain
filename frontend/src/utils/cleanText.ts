/**
 * Safely extracts clean human-readable text from AI / translation responses.
 * Prevents displaying raw JSON objects or metadata like:
 * { "translatedText": "...", "detectedSourceLang": "..." }
 */
export function extractCleanText(input: unknown): string {
  if (input === null || input === undefined) return ''

  // If already an object with translatedText, answer, or explanation
  if (typeof input === 'object') {
    const obj = input as Record<string, any>
    if (typeof obj.translatedText === 'string') return extractCleanText(obj.translatedText)
    if (typeof obj.answer === 'string') return extractCleanText(obj.answer)
    if (typeof obj.explanation === 'string') return extractCleanText(obj.explanation)
    if (typeof obj.content === 'string') return extractCleanText(obj.content)
  }

  if (typeof input !== 'string') {
    return String(input)
  }

  let text = input.trim()

  // Strip code fences if the entire string is ```json { ... } ```
  if (text.startsWith('```json') && text.endsWith('```')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  } else if (text.startsWith('```') && text.endsWith('```') && (text.includes('"translatedText"') || text.includes('"answer"'))) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
  }

  // If text is a JSON string representation
  if (text.startsWith('{') && (text.includes('"translatedText"') || text.includes('"answer"') || text.includes('"explanation"'))) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.translatedText === 'string') {
          return extractCleanText(parsed.translatedText)
        }
        if (typeof parsed.answer === 'string') {
          return extractCleanText(parsed.answer)
        }
        if (typeof parsed.explanation === 'string') {
          return extractCleanText(parsed.explanation)
        }
      }
    } catch {
      // Regex fallback if JSON was malformed by unescaped newlines/quotes
      const match = text.match(/"(?:translatedText|answer|explanation)"\s*:\s*"([\s\S]*?)"(?:\s*,\s*"detectedSourceLang"|\s*\})/)
      if (match && match[1]) {
        try {
          const unescaped = JSON.parse(`"${match[1]}"`)
          return extractCleanText(unescaped)
        } catch {
          return match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '\t')
            .trim()
        }
      }
    }
  }

  return text
}
