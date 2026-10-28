import { z } from 'zod'

export const attachmentInputSchema = z.object({
  url: z.string().min(1),
  filename: z.string().min(1),
  fileType: z.enum(['IMAGE', 'AUDIO']),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  extractedText: z.string().nullable().optional(),
  processingStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  processingError: z.string().nullable().optional()
})

export const createDoubtSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    content: z.string().min(10, 'Details must be at least 10 characters').max(10000, 'Details cannot exceed 10000 characters'),
    subjectId: z.string().min(1, 'Subject is required'),
    mediaUrl: z.string().min(1).optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional(),
    attachments: z.array(attachmentInputSchema).max(5).optional()
  })
})

export const listDoubtsQuerySchema = z.object({
  query: z.object({
    subjectId: z.string().optional(),
    authorId: z.string().optional(),
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

export const acceptDoubtSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    answerId: z.string().min(1)
  })
})

export const resolveDoubtSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    answerId: z.string().min(1).optional()
  }).default({})
})

export const updateDoubtSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).max(10000).optional(),
    mediaUrl: z.string().min(1).optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional(),
    attachments: z.array(attachmentInputSchema).max(5).optional()
  })
})

export const searchDoubtsQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1),
    subjectId: z.string().optional(),
    isResolved: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
})

export const smartSearchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Query is required'),
    subjectId: z.string().optional(),
    threshold: z.coerce.number().min(0).max(1).optional()
  })
})

export const searchFeedbackSchema = z.object({
  body: z.object({
    doubtId: z.string().optional(),
    action: z.enum(['ANSWERED_MY_DOUBT', 'NONE_HELPED_POSTED']),
    query: z.string().min(1)
  })
})

