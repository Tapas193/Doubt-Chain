import { api } from '../lib/apiClient'
import {
  Community,
  CommunityMember,
  CommunityAnnouncement,
  MyCommunityResponse,
  Doubt,
  Paginated
} from '../types/api'

export const communityService = {
  listCommunities: (params?: { q?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return api.get<Paginated<Community>>(`/communities${q ? `?${q}` : ''}`)
  },

  getCommunity: (idOrSlug: string) => {
    return api.get<Community>(`/communities/${idOrSlug}`)
  },

  getMyCommunity: () => {
    return api.get<MyCommunityResponse | null>('/communities/my')
  },

  createCommunity: (data: {
    name: string
    code: string
    slug: string
    description?: string
    emailDomain?: string
    department?: string
    academicYear?: string
    location?: string
  }) => {
    return api.post<Community>('/communities', data)
  },

  requestJoin: (
    communityId: string,
    data?: { department?: string; academicYear?: string; requestNote?: string }
  ) => {
    return api.post<{ status: string; message: string; membership: CommunityMember }>(
      `/communities/${communityId}/join`,
      data
    )
  },

  listMembershipRequests: (communityId: string) => {
    return api.get<CommunityMember[]>(`/communities/${communityId}/requests`)
  },

  reviewMembershipRequest: (
    communityId: string,
    membershipId: string,
    data: { action: 'APPROVE' | 'REJECT'; role?: string; rejectionReason?: string }
  ) => {
    return api.post<CommunityMember>(
      `/communities/${communityId}/requests/${membershipId}`,
      data
    )
  },

  listMembers: (
    communityId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.search) qs.set('search', params.search)
    const q = qs.toString()
    return api.get<Paginated<CommunityMember>>(
      `/communities/${communityId}/members${q ? `?${q}` : ''}`
    )
  },

  listDiscussions: (
    communityId: string,
    params?: { page?: number; limit?: number; category?: string; search?: string; subjectId?: string }
  ) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.category) qs.set('category', params.category)
    if (params?.search) qs.set('search', params.search)
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    const q = qs.toString()
    return api.get<Paginated<Doubt>>(`/communities/${communityId}/discussions${q ? `?${q}` : ''}`)
  },

  createDiscussion: (
    communityId: string,
    data: {
      title: string
      content: string
      subjectId: string
      academicCategory?: string
      mediaUrl?: string
      mediaType?: 'IMAGE' | 'AUDIO'
    }
  ) => {
    return api.post<Doubt>(`/communities/${communityId}/discussions`, data)
  },

  shareDiscussion: (communityId: string, doubtId: string) => {
    return api.post<Doubt>(`/communities/${communityId}/discussions/${doubtId}/share`, {
      confirmWiderNetwork: true
    })
  },

  unshareDiscussion: (communityId: string, doubtId: string) => {
    return api.post<Doubt>(`/communities/${communityId}/discussions/${doubtId}/unshare`)
  },

  listWiderNetwork: (params?: {
    q?: string
    subjectId?: string
    category?: string
    collegeCode?: string
    page?: number
    limit?: number
    sortBy?: 'recent' | 'discussed' | 'resolved'
  }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.subjectId) qs.set('subjectId', params.subjectId)
    if (params?.category) qs.set('category', params.category)
    if (params?.collegeCode) qs.set('collegeCode', params.collegeCode)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.sortBy) qs.set('sortBy', params.sortBy)
    const q = qs.toString()
    return api.get<Paginated<Doubt>>(`/communities/wider-network${q ? `?${q}` : ''}`)
  },

  createAnnouncement: (
    communityId: string,
    data: { title: string; content: string; priority?: 'NORMAL' | 'URGENT' }
  ) => {
    return api.post<CommunityAnnouncement>(`/communities/${communityId}/announcements`, data)
  },

  reportContent: (data: {
    doubtId?: string
    answerId?: string
    reason: string
    details?: string
  }) => {
    return api.post('/communities/report', data)
  }
}
