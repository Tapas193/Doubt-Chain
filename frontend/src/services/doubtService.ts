import { api } from '../lib/apiClient'
import { Doubt, Paginated, Subject, Answer, AnswerComment, Attachment, SmartDuplicateMatch } from '../types/api'

export const doubtService = {
  listSubjects: (params?: { q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    const q = qs.toString()
    return api.get<Subject[]>(`/subjects${q ? `?${q}` : ''}`)
  },
  getSubject: (id: string) => api.get<Subject>(`/subjects/${id}`),
  joinSubject: (id: string, joinCode: string) =>
    api.post<Subject>(`/subjects/${id}/join`, { joinCode }),
  joinSubjectByCode: (joinCode: string) =>
    api.post<Subject>('/subjects/join', { joinCode }),
  uploadFile: async (file: File): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<Attachment>('/uploads', formData)
  },
  findSmartDuplicates: (
    q: string,
    params?: { subjectId?: string; threshold?: number }
  ) => {
    const qs = new URLSearchParams({ q })
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (typeof params?.threshold === 'number') qs.set('threshold', String(params.threshold))
    return api.get<SmartDuplicateMatch[]>(`/doubts/smart-duplicates?${qs.toString()}`)
  },
  recordSearchFeedback: (data: {
    doubtId?: string
    action: 'ANSWERED_MY_DOUBT' | 'NONE_HELPED_POSTED'
    query: string
  }) => api.post('/doubts/search-feedback', data),
  listDoubts: (params?: {
    subjectId?: string
    isResolved?: boolean
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (typeof params?.isResolved === 'boolean') qs.set('isResolved', String(params.isResolved))
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return api.get<Paginated<Doubt>>(`/doubts${q ? `?${q}` : ''}`)
  },
  searchDoubts: (
    q: string,
    params?: { subjectId?: string; isResolved?: boolean; page?: number; limit?: number }
  ) => {
    const qs = new URLSearchParams({ q })
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (typeof params?.isResolved === 'boolean') qs.set('isResolved', String(params.isResolved))
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return api.get<Paginated<Doubt>>(`/doubts/search?${qs.toString()}`)
  },
  getDoubt: (id: string) => api.get<Doubt>(`/doubts/${id}`),
  createDoubt: (data: {
    title: string
    content: string
    subjectId: string
    mediaUrl?: string
    mediaType?: 'IMAGE' | 'AUDIO'
    attachments?: Attachment[]
  }) => api.post<Doubt>('/doubts', data),
  updateDoubt: (
    id: string,
    data: {
      title?: string
      content?: string
      mediaUrl?: string
      mediaType?: 'IMAGE' | 'AUDIO'
      attachments?: Attachment[]
    }
  ) => api.patch<Doubt>(`/doubts/${id}`, data),
  resolveDoubt: (id: string, answerId?: string) =>
    api.post<Doubt>(`/doubts/${id}/resolve`, answerId ? { answerId } : undefined),
  acceptAnswer: (id: string, answerId: string) =>
    api.post<Doubt>(`/doubts/${id}/accept`, { answerId }),
  reopenDoubt: (id: string) => api.post<Doubt>(`/doubts/${id}/reopen`),
  listAnswers: (doubtId: string) => api.get<Answer[]>(`/doubts/${doubtId}/answers`),
  createAnswer: (
    doubtId: string,
    data: {
      content: string
      parentAnswerId?: string
      mediaUrl?: string
      mediaType?: 'IMAGE' | 'AUDIO'
    }
  ) => api.post<Answer>(`/doubts/${doubtId}/answers`, data),
  updateAnswer: (
    answerId: string,
    data: { content?: string; mediaUrl?: string; mediaType?: 'IMAGE' | 'AUDIO' }
  ) => api.patch<Answer>(`/answers/${answerId}`, data),
  deleteAnswer: (answerId: string) => api.delete<{ deleted: boolean }>(`/answers/${answerId}`),
  voteAnswer: (answerId: string, value: 1 | -1) =>
    api.post<Answer>(`/answers/${answerId}/votes`, { value }),
  removeVote: (answerId: string) => api.delete<Answer>(`/answers/${answerId}/votes`),
  upvoteAnswer: (answerId: string) => api.post<Answer>(`/answers/${answerId}/upvote`),
  removeUpvote: (answerId: string) => api.delete<Answer>(`/answers/${answerId}/upvote`),
  listComments: (answerId: string) => api.get<AnswerComment[]>(`/answers/${answerId}/comments`),
  createComment: (answerId: string, content: string) =>
    api.post<AnswerComment>(`/answers/${answerId}/comments`, { content }),
  deleteComment: (answerId: string, commentId: string) =>
    api.delete<{ deleted: boolean }>(`/answers/${answerId}/comments/${commentId}`),
  listFaq: (params?: {
    subjectId?: string
    q?: string
    sortBy?: 'recent' | 'popular'
    page?: number
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (params?.q) qs.set('q', params.q)
    if (params?.sortBy) qs.set('sortBy', params.sortBy)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return api.get<Paginated<Doubt>>(`/faq${q ? `?${q}` : ''}`)
  }
}
