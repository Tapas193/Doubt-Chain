import { Router } from 'express'
import {
  list,
  getDetails,
  getMy,
  create,
  join,
  listRequests,
  reviewRequest,
  listMembers,
  listDiscussions,
  createDiscussion,
  shareDiscussion,
  unshareDiscussion,
  listWiderNetwork,
  report,
  addAnnouncement
} from '../controllers/community.controller.js'
import { validate } from '../middleware/validate.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { asyncWrap } from '../utils/asyncWrap.js'
import {
  listCommunitiesQuerySchema,
  createCommunitySchema,
  joinCommunitySchema,
  reviewMembershipSchema,
  createCommunityDiscussionSchema,
  shareDiscussionSchema,
  listWiderNetworkQuerySchema,
  reportContentSchema,
  createAnnouncementSchema
} from '../validators/community.js'

const router = Router()

// Wider network discussions (publicly discoverable across colleges)
router.get('/wider-network', optionalAuth, validate(listWiderNetworkQuerySchema), asyncWrap(listWiderNetwork))

// My primary community & membership status
router.get('/my', requireAuth, asyncWrap(getMy))

// Content reporting for moderation
router.post('/report', requireAuth, validate(reportContentSchema), asyncWrap(report))

// List and explore college communities
router.get('/', optionalAuth, validate(listCommunitiesQuerySchema), asyncWrap(list))
router.post('/', requireAuth, validate(createCommunitySchema), asyncWrap(create))

// Specific community details & actions
router.get('/:idOrSlug', optionalAuth, asyncWrap(getDetails))
router.post('/:id/join', requireAuth, validate(joinCommunitySchema), asyncWrap(join))
router.get('/:id/members', requireAuth, asyncWrap(listMembers))
router.get('/:id/requests', requireAuth, asyncWrap(listRequests))
router.post('/:id/requests/:membershipId', requireAuth, validate(reviewMembershipSchema), asyncWrap(reviewRequest))
router.post('/:id/announcements', requireAuth, validate(createAnnouncementSchema), asyncWrap(addAnnouncement))

// Community-scoped discussions
router.get('/:id/discussions', optionalAuth, asyncWrap(listDiscussions))
router.post('/:id/discussions', requireAuth, validate(createCommunityDiscussionSchema), asyncWrap(createDiscussion))

// Ask the Wider Network: Explicit sharing of a discussion
router.post('/:id/discussions/:doubtId/share', requireAuth, validate(shareDiscussionSchema), asyncWrap(shareDiscussion))
router.post('/:id/discussions/:doubtId/unshare', requireAuth, asyncWrap(unshareDiscussion))

export default router
