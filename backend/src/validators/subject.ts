import { z } from 'zod'

export const subjectParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
})
