import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { ok } from '../utils/http.js'
import {
  listCommunities,
  getCommunityByIdOrSlug,
  getMyCommunity,
  createCommunity,
  requestJoinCommunity,
  listMembershipRequests,
  reviewMembershipRequest,
  listCommunityMembers,
  listCommunityDiscussions,
  createCommunityDiscussion,
  shareDiscussionWithWiderNetwork,
  unshareDiscussionFromWiderNetwork,
  listWiderNetworkDiscussions,
  reportContent,
  createAnnouncement
} from '../services/community.service.js'

export async function list(req: AuthRequest, res: Response) {
  const { q, page, limit } = req.query as any
  const result = await listCommunities({
    q,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    userId: req.user?.userId
  })
  res.json(ok(result))
}

export async function getDetails(req: AuthRequest, res: Response) {
  const result = await getCommunityByIdOrSlug(req.params.idOrSlug, req.user?.userId)
  res.json(ok(result))
}

export async function getMy(req: AuthRequest, res: Response) {
  const result = await getMyCommunity(req.user!.userId)
  res.json(ok(result))
}

export async function create(req: AuthRequest, res: Response) {
  const community = await createCommunity(
    { userId: req.user!.userId, role: req.user!.role },
    req.body
  )
  res.status(201).json(ok(community, 'College community created'))
}

export async function join(req: AuthRequest, res: Response) {
  const result = await requestJoinCommunity(req.params.id, req.user!.userId, req.body)
  res.status(result.status === 'APPROVED' ? 200 : 202).json(ok(result, result.message))
}

export async function listRequests(req: AuthRequest, res: Response) {
  const requests = await listMembershipRequests(req.params.id, req.user!.userId)
  res.json(ok(requests))
}

export async function reviewRequest(req: AuthRequest, res: Response) {
  const result = await reviewMembershipRequest(
    req.params.id,
    req.params.membershipId,
    req.user!.userId,
    req.body
  )
  res.json(ok(result, `Membership ${req.body.action.toLowerCase()}ed`))
}

export async function listMembers(req: AuthRequest, res: Response) {
  const { page, limit, search } = req.query as any
  const result = await listCommunityMembers(req.params.id, req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search
  })
  res.json(ok(result))
}

export async function listDiscussions(req: AuthRequest, res: Response) {
  const { page, limit, category, search, subjectId } = req.query as any
  const result = await listCommunityDiscussions(req.params.id, req.user?.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    category,
    search,
    subjectId
  })
  res.json(ok(result))
}

export async function createDiscussion(req: AuthRequest, res: Response) {
  const doubt = await createCommunityDiscussion(req.params.id, req.user!.userId, req.body)
  res.status(201).json(ok(doubt, 'College discussion created'))
}

export async function shareDiscussion(req: AuthRequest, res: Response) {
  const result = await shareDiscussionWithWiderNetwork(req.params.doubtId, req.user!.userId)
  res.json(ok(result, 'Discussion shared with the wider academic network'))
}

export async function unshareDiscussion(req: AuthRequest, res: Response) {
  const result = await unshareDiscussionFromWiderNetwork(req.params.doubtId, req.user!.userId)
  res.json(ok(result, 'Discussion unshared from the wider network'))
}

export async function listWiderNetwork(req: AuthRequest, res: Response) {
  const { q, subjectId, category, collegeCode, page, limit, sortBy } = req.query as any
  const result = await listWiderNetworkDiscussions({
    q,
    subjectId,
    category,
    collegeCode,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy
  })
  res.json(ok(result))
}

export async function report(req: AuthRequest, res: Response) {
  const result = await reportContent(req.user!.userId, req.body)
  res.status(201).json(ok(result, 'Report submitted for moderation review'))
}

export async function addAnnouncement(req: AuthRequest, res: Response) {
  const result = await createAnnouncement(req.params.id, req.user!.userId, req.body)
  res.status(201).json(ok(result, 'Announcement published to community'))
}
