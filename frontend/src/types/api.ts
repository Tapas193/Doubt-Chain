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
  preferredLanguage?: string | null
  createdAt: string
}

export type Subject = {
  id: string
  name: string
  code: string
  description?: string | null
  createdAt: string
  updatedAt: string
  isMember?: boolean
  _count?: {
    doubts?: number
    members?: number
  }
}

export type Author = {
  id: string
  username: string
  displayName: string
}

export type Attachment = {
  id?: string
  url: string
  filename: string
  fileType: 'IMAGE' | 'AUDIO'
  mimeType: string
  size: number
  extractedText?: string | null
  detectedLanguage?: string | null
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  processingError?: string | null
  createdAt?: string
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
  acceptedAnswer?: (Pick<Answer, 'id' | 'content' | 'authorId' | 'createdAt'> & {
    author?: Author
    _count?: { upvotes: number }
  }) | null
  attachments?: Attachment[]
  _count?: { answers: number }
  answers?: Answer[]
  aiQuestion?: string | null
  aiAnswer?: string | null
  aiTags?: string[]
  aiGeneratedAt?: string | null
  aiStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  isAiGenerated?: boolean
  relevanceScore?: number
  semanticSimilarity?: number
  matchType?: 'hybrid' | 'semantic' | 'keyword' | 'keyword_fallback' | 'none'
  contentSnippet?: string
  acceptedAnswerSnippet?: string | null
  faqSnippet?: string | null
}

export type SmartDuplicateMatch = {
  id: string
  title: string
  contentSnippet: string
  similarity: number
  similarityPercent: number
  matchType: 'semantic' | 'keyword_fallback'
  subject?: Subject
  acceptedAnswer?: {
    id: string
    content: string
    author?: Author
  } | null
  aiSummary?: string | null
  discussionUrl: string
}

export type Answer = {
  id: string
  content: string
  mediaUrl?: string | null
  mediaType?: 'IMAGE' | 'AUDIO' | null
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
  authorId: string
  doubtId: string
  parentAnswerId?: string | null
  author?: Author
  isAccepted?: boolean
  isUpvotedByMe?: boolean
  _count?: { upvotes: number }
  voteSummary?: VoteSummary
  replies?: Answer[]
  attachments?: Attachment[]
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
  searchMode?: 'hybrid' | 'keyword_fallback' | 'recent' | 'none'
}

export type AiConversation = {
  id: string
  userId: string
  title: string
  subjectId?: string | null
  language: string
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
  messages?: AiMessage[]
}

export type AiMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  retrievedContext?: Array<{
    doubtId: string
    title: string
    subjectName?: string
    verifiedSolution: string | null
    faqSummary: string | null
  }> | null
  feedback?: {
    id: string
    isHelpful: boolean
  } | null
  reports?: Array<{ id: string; reason: string }>
  createdAt: string
}

export type AiAskResponse = {
  messageId?: string
  conversationId?: string
  answer: string
  language: 'en' | 'hi' | 'hinglish'
  generatedBy: string
  disclaimer: string
  retrievedContext?: Array<{
    doubtId: string
    title: string
    subjectName?: string
    verifiedSolution: string | null
    faqSummary: string | null
  }>
}
