import { z } from 'zod'

export const faqQuerySchema = z.object({
  query: z.object({
    subjectId: z.string().optional(),
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})
