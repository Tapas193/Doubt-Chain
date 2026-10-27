import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doubtService } from '../src/services/doubtService'
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

describe('Frontend doubtService and workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Feature 1: listSubjects sends search query when provided', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([{ id: 'sub-1', name: 'Data Structures', code: 'CS201' }])
    const res = await doubtService.listSubjects({ q: 'Data' })
    expect(api.get).toHaveBeenCalledWith('/subjects?q=Data')
    expect(res).toHaveLength(1)
  })

  it('Feature 1: joinSubject posts to /subjects/:id/join with joinCode', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'sub-1', name: 'Data Structures', isMember: true })
    const res = await doubtService.joinSubject('sub-1', 'DS-201')
    expect(api.post).toHaveBeenCalledWith('/subjects/sub-1/join', { joinCode: 'DS-201' })
    expect(res.isMember).toBe(true)
  })

  it('Feature 1: joinSubjectByCode posts to /subjects/join with joinCode', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'sub-1', name: 'Data Structures', isMember: true })
    const res = await doubtService.joinSubjectByCode('DS-201')
    expect(api.post).toHaveBeenCalledWith('/subjects/join', { joinCode: 'DS-201' })
    expect(res.isMember).toBe(true)
  })

  it('Feature 2: creates doubt with attachments', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'doubt-1', title: 'Test doubt' })
    await doubtService.createDoubt({
      title: 'Test doubt',
      content: 'Detailed question description here',
      subjectId: 'sub-1',
      attachments: [
        { url: '/uploads/img.png', filename: 'img.png', fileType: 'IMAGE', mimeType: 'image/png', size: 1024 }
      ]
    })
    expect(api.post).toHaveBeenCalledWith(
      '/doubts',
      expect.objectContaining({
        title: 'Test doubt',
        subjectId: 'sub-1',
        attachments: expect.arrayContaining([expect.objectContaining({ filename: 'img.png' })])
      })
    )
  })

  it('Feature 3: creates nested reply with parentAnswerId', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'ans-reply', parentAnswerId: 'ans-1' })
    await doubtService.createAnswer('doubt-1', {
      content: 'This is a nested reply',
      parentAnswerId: 'ans-1'
    })
    expect(api.post).toHaveBeenCalledWith(
      '/doubts/doubt-1/answers',
      expect.objectContaining({
        content: 'This is a nested reply',
        parentAnswerId: 'ans-1'
      })
    )
  })

  it('Feature 3: accepts answer to resolve doubt', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'doubt-1', isResolved: true, acceptedAnswerId: 'ans-1' })
    const res = await doubtService.acceptAnswer('doubt-1', 'ans-1')
    expect(api.post).toHaveBeenCalledWith('/doubts/doubt-1/accept', { answerId: 'ans-1' })
    expect(res.isResolved).toBe(true)
  })

  it('Feature 4: searchDoubts queries with isResolved=true for duplicates', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], total: 0 })
    await doubtService.searchDoubts('binary tree', { isResolved: true, subjectId: 'sub-1' })
    expect(api.get).toHaveBeenCalledWith('/doubts/search?q=binary+tree&subjectId=sub-1&isResolved=true')
  })

  it('Feature 4: searchDoubts allows searching without isResolved restriction to find all existing doubts', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [{ id: 'd-1', title: 'Multiplexer' }], total: 1 })
    const res = await doubtService.searchDoubts('mul')
    expect(api.get).toHaveBeenCalledWith('/doubts/search?q=mul')
    expect(res.items).toHaveLength(1)
  })

  it('Feature 5: upvoteAnswer and removeUpvote toggle correctly', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'ans-1', isUpvotedByMe: true })
    vi.mocked(api.delete).mockResolvedValueOnce({ id: 'ans-1', isUpvotedByMe: false })

    await doubtService.upvoteAnswer('ans-1')
    expect(api.post).toHaveBeenCalledWith('/answers/ans-1/upvote')

    await doubtService.removeUpvote('ans-1')
    expect(api.delete).toHaveBeenCalledWith('/answers/ans-1/upvote')
  })

  it('Feature 6: listFaq queries resolved FAQ doubts with sorting', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ items: [], total: 0 })
    await doubtService.listFaq({ subjectId: 'sub-1', q: 'tree', sortBy: 'recent' })
    expect(api.get).toHaveBeenCalledWith('/faq?subjectId=sub-1&q=tree&sortBy=recent')
  })
})
