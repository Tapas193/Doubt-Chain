import { z } from 'zod'

export const createAnswerSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    content: z.string().min(1),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional()
  })
})

export const answerParamsSchema = z.object({
  params: z.object({
    answerId: z.string().min(1)
  })
})

export const updateAnswerSchema = z.object({
  params: z.object({
    answerId: z.string().min(1)
  }),
  body: z.object({
    content: z.string().min(1).optional(),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional()
  })
})

export const voteAnswerSchema = z.object({
  params: z.object({
    answerId: z.string().min(1)
  }),
  body: z.object({
    value: z.union([z.literal(1), z.literal(-1)])
  })
})
