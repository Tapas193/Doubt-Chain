import { z } from 'zod'

export const answerCommentsParamsSchema = z.object({
  params: z.object({
    answerId: z.string().min(1)
  })
})

export const createCommentSchema = z.object({
  params: z.object({
    answerId: z.string().min(1)
  }),
  body: z.object({
    content: z.string().trim().min(1).max(2000)
  })
})

export const deleteCommentSchema = z.object({
  params: z.object({
    answerId: z.string().min(1),
    commentId: z.string().min(1)
  })
})
