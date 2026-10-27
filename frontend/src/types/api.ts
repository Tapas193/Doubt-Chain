export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  error?: unknown
}

export type User = {
  id: string
  email: string
  username: string
  displayName: string
  fullName?: string | null
  profession?: 'STUDENT' | 'PROFESSOR' | 'CORPORATE_WORKER' | null
  identificationNumber?: string | null
  createdAt: string
}

export type Subject = {
  id: string
  name: string
  code: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export type Author = {
  id: string
  username: string
  displayName: string
}

export type Doubt = {
  id: string
  title: string
  content: string
  mediaUrl?: string | null
  mediaType?: 'IMAGE' | 'AUDIO' | null
  isResolved: boolean
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
  authorId: string
  subjectId: string
  author?: Author
  subject?: Subject
  acceptedAnswerId?: string | null
  acceptedAnswer?: Pick<Answer, 'id' | 'content' | 'authorId' | 'createdAt'> | null
  _count?: { answers: number }
  answers?: Answer[]
}

export type Answer = {
  id: string
  content: string
  mediaUrl?: string | null
  mediaType?: 'IMAGE' | 'AUDIO' | null
  createdAt: string
  updatedAt: string
  authorId: string
  doubtId: string
  author?: Author
  _count?: { upvotes: number }
  voteSummary?: VoteSummary
}

export type VoteSummary = {
  upvotes: number
  downvotes: number
  viewerVote: -1 | 0 | 1
}

export type AnswerComment = {
  id: string
  content: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  authorId: string
  answerId: string
  author?: Author
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}
