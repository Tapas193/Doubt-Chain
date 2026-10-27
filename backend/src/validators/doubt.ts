import { z } from 'zod'

export const createDoubtSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(1),
    subjectId: z.string().min(1),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional()
  })
})

export const listDoubtsQuerySchema = z.object({
  query: z.object({
    subjectId: z.string().optional(),
    isResolved: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})

export const doubtParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})

export const updateDoubtSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(1).optional(),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional()
  })
})

export const searchDoubtsQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1),
    subjectId: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})
