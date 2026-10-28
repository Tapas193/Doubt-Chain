import { describe, it, expect, vi, beforeEach } from 'vitest'
import { communityService } from '../src/services/communityService'
import { notificationService } from '../src/services/notificationService'
import { api } from '../src/lib/apiClient'

vi.mock('../src/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn()
  }
}))

describe('Community of Communities & Peer-to-Peer Academic Network Client Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Community Service', () => {
    it('fetches student primary community', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        community: {
          id: 'comm-1',
          name: 'IIT Bombay',
          code: 'IITB',
          slug: 'iit-bombay',
          memberCount: 150
        },
        membership: {
          id: 'mem-1',
          role: 'STUDENT',
          status: 'APPROVED'
        },
        discussions: [],
        announcements: [],
        members: []
      })

      const res = await communityService.getMyCommunity()
      expect(api.get).toHaveBeenCalledWith('/communities/my')
      expect(res?.community.code).toBe('IITB')
      expect(res?.membership?.status).toBe('APPROVED')
    })

    it('lists communities with search query and pagination', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        items: [
          { id: 'comm-1', name: 'IIT Bombay', code: 'IITB', slug: 'iit-bombay' },
          { id: 'comm-2', name: 'BITS Pilani', code: 'BITS', slug: 'bits-pilani' }
        ],
        pagination: { page: 1, limit: 12, total: 2, totalPages: 1 }
      })

      const res = await communityService.listCommunities({ q: 'IIT', page: 1, limit: 12 })
      expect(api.get).toHaveBeenCalledWith('/communities?q=IIT&page=1&limit=12')
      expect(res.items).toHaveLength(2)
      expect(res.items[0].code).toBe('IITB')
    })

    it('requests membership to a college community', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        status: 'PENDING',
        message: 'Membership request submitted successfully for review',
        membership: { id: 'mem-new', status: 'PENDING', role: 'STUDENT' }
      })

      const res = await communityService.requestJoin('comm-1', {
        department: 'Computer Science',
        academicYear: '2026-2027',
        requestNote: 'I am a 3rd year student'
      })

      expect(api.post).toHaveBeenCalledWith('/communities/comm-1/join', {
        department: 'Computer Science',
        academicYear: '2026-2027',
        requestNote: 'I am a 3rd year student'
      })
      expect(res.status).toBe('PENDING')
    })

    it('creates community-scoped discussion with category', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        id: 'doubt-1',
        title: 'B-Tree Indexing in PostgreSQL',
        communityId: 'comm-1',
        academicCategory: 'DSA',
        isSharedWithWiderNetwork: false
      })

      const res = await communityService.createDiscussion('comm-1', {
        title: 'B-Tree Indexing in PostgreSQL',
        content: 'How does multi-column indexing work?',
        subjectId: 'sub-db',
        academicCategory: 'DSA'
      })

      expect(api.post).toHaveBeenCalledWith('/communities/comm-1/discussions', {
        title: 'B-Tree Indexing in PostgreSQL',
        content: 'How does multi-column indexing work?',
        subjectId: 'sub-db',
        academicCategory: 'DSA'
      })
      expect(res.academicCategory).toBe('DSA')
      expect(res.isSharedWithWiderNetwork).toBe(false)
    })

    it('explicitly shares discussion with the wider network', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        id: 'doubt-1',
        title: 'B-Tree Indexing in PostgreSQL',
        isSharedWithWiderNetwork: true,
        sharedAt: '2026-10-28T07:00:00Z'
      })

      const res = await communityService.shareDiscussion('comm-1', 'doubt-1')
      expect(api.post).toHaveBeenCalledWith('/communities/comm-1/discussions/doubt-1/share', {
        confirmWiderNetwork: true
      })
      expect(res.isSharedWithWiderNetwork).toBe(true)
    })

    it('retrieves wider network feed with topic filters', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        items: [
          {
            id: 'doubt-shared',
            title: 'Distributed Consensus with Raft',
            isSharedWithWiderNetwork: true,
            community: { name: 'IIT Bombay', code: 'IITB' }
          }
        ],
        pagination: { page: 1, limit: 15, total: 1, totalPages: 1 }
      })

      const res = await communityService.listWiderNetwork({ category: 'DSA', page: 1 })
      expect(api.get).toHaveBeenCalledWith('/communities/wider-network?category=DSA&page=1')
      expect(res.items[0].isSharedWithWiderNetwork).toBe(true)
      expect(res.items[0].community?.code).toBe('IITB')
    })

    it('reviews pending membership request as college admin', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        id: 'mem-1',
        status: 'APPROVED',
        role: 'STUDENT'
      })

      const res = await communityService.reviewMembershipRequest('comm-1', 'mem-1', {
        action: 'APPROVE'
      })

      expect(api.post).toHaveBeenCalledWith('/communities/comm-1/requests/mem-1', {
        action: 'APPROVE'
      })
      expect(res.status).toBe('APPROVED')
    })
  })

  describe('Notification Service', () => {
    it('fetches unread and historical notifications', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        items: [
          {
            id: 'notif-1',
            type: 'WIDER_NETWORK_REPLY',
            title: 'Wider Network Reply',
            message: 'A student from another college answered your question',
            isRead: false
          }
        ],
        unreadCount: 1
      })

      const res = await notificationService.list()
      expect(api.get).toHaveBeenCalledWith('/notifications')
      expect(res.unreadCount).toBe(1)
      expect(res.items[0].type).toBe('WIDER_NETWORK_REPLY')
    })

    it('marks notification as read', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true
      })

      await notificationService.markRead('notif-1')
      expect(api.post).toHaveBeenCalledWith('/notifications/notif-1/read')
    })

    it('marks all notifications as read', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        success: true,
        count: 5
      })

      await notificationService.markAllRead()
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all')
    })
  })
})
