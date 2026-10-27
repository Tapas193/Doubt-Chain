import { z } from 'zod'

export const subjectParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})

export const joinSubjectSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    joinCode: z.string().min(1, 'Join code is required').trim()
  })
})

export const joinByCodeSchema = z.object({
  body: z.object({
    joinCode: z.string().min(1, 'Join code is required').trim()
  })
})

export const listSubjectsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  }).optional()
})
