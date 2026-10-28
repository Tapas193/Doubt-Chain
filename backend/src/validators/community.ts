import { z } from 'zod'

export const listCommunitiesQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
  })
})

export const createCommunitySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Community name must be at least 3 characters').max(100),
    code: z.string().min(2, 'Code must be at least 2 characters').max(20).toUpperCase(),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens'),
    description: z.string().max(1000).optional(),
    emailDomain: z.string().max(100).optional(),
    department: z.string().max(100).optional(),
    academicYear: z.string().max(50).optional(),
    location: z.string().max(100).optional()
  })
})

export const joinCommunitySchema = z.object({
  body: z.object({
    department: z.string().max(100).optional(),
    academicYear: z.string().max(50).optional(),
    requestNote: z.string().max(300).optional()
  })
})

export const reviewMembershipSchema = z.object({
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    role: z.enum(['STUDENT', 'MODERATOR', 'COLLEGE_ADMIN']).optional(),
    rejectionReason: z.string().max(300).optional()
  })
})

export const createCommunityDiscussionSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    subjectId: z.string().min(1, 'Subject is required'),
    academicCategory: z.enum([
      'GENERAL_DOUBT',
      'DSA',
      'PROGRAMMING',
      'PROJECTS',
      'INTERVIEWS',
      'RESOURCES',
      'EVENTS'
    ]).default('GENERAL_DOUBT'),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['IMAGE', 'AUDIO']).optional(),
    attachments: z.array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        fileType: z.enum(['IMAGE', 'AUDIO']),
        mimeType: z.string(),
        size: z.number()
      })
    ).optional()
  })
})

export const shareDiscussionSchema = z.object({
  body: z.object({
    confirmWiderNetwork: z.boolean().refine(val => val === true, {
      message: 'Explicit confirmation is required to share with the wider network'
    })
  })
})

export const listWiderNetworkQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    subjectId: z.string().optional(),
    category: z.string().optional(),
    collegeCode: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(['recent', 'discussed', 'resolved']).optional()
  })
})

export const reportContentSchema = z.object({
  body: z.object({
    doubtId: z.string().optional(),
    answerId: z.string().optional(),
    reason: z.enum(['SPAM', 'HARASSMENT', 'OFF_TOPIC', 'INAPPROPRIATE', 'OTHER']),
    details: z.string().max(500).optional()
  }).refine(data => data.doubtId || data.answerId, {
    message: 'Either doubtId or answerId must be provided'
  })
})

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150),
    content: z.string().min(5).max(2000),
    priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL')
  })
})
