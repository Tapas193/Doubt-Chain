import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'
import { createNotification } from './notification.service.js'
import { CommunityRole, MembershipStatus } from '@prisma/client'

export async function listCommunities(params: {
  q?: string
  page?: number
  limit?: number
  userId?: string
}) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, Math.max(1, params.limit || 12))
  const skip = (page - 1) * limit

  const where: any = {
    status: 'ACTIVE'
  }

  if (params.q?.trim()) {
    const q = params.q.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        description: true,
        logoUrl: true,
        location: true,
        department: true,
        academicYear: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            members: { where: { status: 'APPROVED' } },
            doubts: true
          }
        },
        members: params.userId
          ? {
              where: { userId: params.userId },
              select: {
                id: true,
                role: true,
                status: true,
                isPrimary: true
              }
            }
          : false
      }
    }),
    prisma.community.count({ where })
  ])

  const formatted = items.map((c: any) => {
    const userMembership = c.members && c.members.length > 0 ? c.members[0] : null
    const { members, ...rest } = c
    return {
      ...rest,
      memberCount: c._count.members,
      discussionCount: c._count.doubts,
      membership: userMembership
    }
  })

  return {
    items: formatted,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export async function findCommunityRecord(idOrSlug: string) {
  if (!idOrSlug) return null

  // 1. Exact ID
  let community = await prisma.community.findUnique({
    where: { id: idOrSlug }
  })
  if (community) return community

  const clean = idOrSlug.trim()
  const lower = clean.toLowerCase()
  const upper = clean.toUpperCase()

  // Suffix strip/add variants (e.g. iitb-test-hub -> iitb-test, or bits-test -> bits-test-hub)
  const stripped = lower.replace(/-(hub|network|community|academic|college)$/i, '')
  const strippedCode = stripped.replace(/-/g, '_').toUpperCase()

  const candidates = Array.from(new Set([
    clean,
    lower,
    upper,
    clean.replace(/-/g, '_').toUpperCase(),
    clean.replace(/_/g, '-').toLowerCase(),
    stripped,
    strippedCode,
    `${lower}-hub`,
    `${lower}_hub`.toUpperCase(),
    `${lower}-community`,
    `${lower}-network`
  ]))

  // 2. Match slug or code in candidates (case-insensitive)
  community = await prisma.community.findFirst({
    where: {
      OR: [
        { slug: { in: candidates, mode: 'insensitive' } },
        { code: { in: candidates, mode: 'insensitive' } }
      ]
    }
  })
  if (community) return community

  // 3. Match name by slugified or space-separated form
  const nameCandidate = clean.replace(/[-_]+/g, ' ')
  community = await prisma.community.findFirst({
    where: {
      OR: [
        { name: { equals: nameCandidate, mode: 'insensitive' } },
        { name: { contains: nameCandidate, mode: 'insensitive' } }
      ]
    }
  })

  return community
}

export async function getCommunityByIdOrSlug(idOrSlug: string, userId?: string) {
  const baseCommunity = await findCommunityRecord(idOrSlug)

  if (!baseCommunity) {
    throw new HttpError(404, 'College community not found')
  }

  const community = await prisma.community.findUnique({
    where: { id: baseCommunity.id },
    include: {
      _count: {
        select: {
          members: { where: { status: 'APPROVED' } },
          doubts: true
        }
      },
      announcements: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          author: { select: { id: true, displayName: true, username: true } }
        }
      }
    }
  })

  if (!community) {
    throw new HttpError(404, 'College community not found')
  }

  let membership: any = null
  let isPlatformAdmin = false

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    })
    isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))

    membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id
        }
      }
    })
  }

  const isApprovedMember = membership?.status === 'APPROVED'
  const isCollegeAdmin = membership?.role === 'COLLEGE_ADMIN' && isApprovedMember
  const canManage = isCollegeAdmin || isPlatformAdmin

  return {
    ...community,
    memberCount: community._count.members,
    discussionCount: community._count.doubts,
    membership,
    isApprovedMember,
    canManage
  }
}

export async function getMyCommunity(userId: string) {
  // Find approved primary membership first, or any approved membership, or pending
  const membership = await prisma.communityMember.findFirst({
    where: {
      userId,
      status: { in: ['APPROVED', 'PENDING'] }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { status: 'asc' }, // APPROVED comes before PENDING
      { createdAt: 'desc' }
    ],
    include: {
      community: {
        include: {
          _count: {
            select: {
              members: { where: { status: 'APPROVED' } },
              doubts: true
            }
          },
          announcements: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              author: { select: { id: true, displayName: true, username: true } }
            }
          }
        }
      }
    }
  })

  if (!membership) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))
  const isCollegeAdmin = membership.role === 'COLLEGE_ADMIN' && membership.status === 'APPROVED'

  return {
    membership: {
      id: membership.id,
      role: membership.role,
      status: membership.status,
      isPrimary: membership.isPrimary,
      department: membership.department,
      academicYear: membership.academicYear,
      requestedAt: membership.requestedAt,
      reviewedAt: membership.reviewedAt
    },
    community: {
      ...membership.community,
      memberCount: membership.community._count.members,
      discussionCount: membership.community._count.doubts
    },
    canManage: isCollegeAdmin || isPlatformAdmin
  }
}

export async function createCommunity(
  creatorUser: { userId: string; role?: string },
  data: {
    name: string
    code: string
    slug: string
    description?: string
    emailDomain?: string
    department?: string
    academicYear?: string
    location?: string
  }
) {
  const existing = await prisma.community.findFirst({
    where: {
      OR: [
        { code: data.code.toUpperCase() },
        { slug: data.slug.toLowerCase() },
        { name: data.name }
      ]
    }
  })

  if (existing) {
    throw new HttpError(409, 'A community with this code, slug, or name already exists')
  }

  const community = await prisma.$transaction(async (tx) => {
    const created = await tx.community.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        slug: data.slug.trim().toLowerCase(),
        description: data.description?.trim(),
        emailDomain: data.emailDomain?.trim().toLowerCase(),
        department: data.department?.trim(),
        academicYear: data.academicYear?.trim(),
        location: data.location?.trim(),
        creatorId: creatorUser.userId
      }
    })

    // Assign creator as primary COLLEGE_ADMIN
    await tx.communityMember.create({
      data: {
        userId: creatorUser.userId,
        communityId: created.id,
        role: 'COLLEGE_ADMIN',
        status: 'APPROVED',
        isPrimary: true
      }
    })

    return created
  })

  return community
}

export async function requestJoinCommunity(
  communityId: string,
  userId: string,
  data?: { department?: string; academicYear?: string; requestNote?: string }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'Community not found')
  }
  const resolvedCommunityId = community.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new HttpError(401, 'User not found')
  }

  const existing = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId: resolvedCommunityId
      }
    }
  })

  if (existing) {
    if (existing.status === 'APPROVED') {
      return { status: 'APPROVED', message: 'You are already an approved member of this community', membership: existing }
    }
    if (existing.status === 'PENDING') {
      return { status: 'PENDING', message: 'Your membership request is currently under review by college admins', membership: existing }
    }
    if (existing.status === 'SUSPENDED') {
      throw new HttpError(403, 'Your membership in this community has been suspended')
    }
    if (existing.status === 'REJECTED') {
      // Allow re-applying
      const updated = await prisma.communityMember.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          department: data?.department?.trim() || existing.department,
          academicYear: data?.academicYear?.trim() || existing.academicYear,
          requestedAt: new Date(),
          rejectionReason: null
        }
      })
      return { status: 'PENDING', message: 'Membership request resubmitted for review', membership: updated }
    }
  }

  // Check auto-verification by institutional email domain if available
  let autoApprove = false
  if (community.emailDomain && user.email.toLowerCase().endsWith(`@${community.emailDomain.toLowerCase()}`)) {
    autoApprove = true
  }

  // Check if user already has an approved primary community
  const primaryCount = await prisma.communityMember.count({
    where: { userId, isPrimary: true, status: 'APPROVED' }
  })

  const newMembership = await prisma.communityMember.create({
    data: {
      userId,
      communityId: resolvedCommunityId,
      role: 'STUDENT',
      status: autoApprove ? 'APPROVED' : 'PENDING',
      isPrimary: primaryCount === 0,
      department: data?.department?.trim(),
      academicYear: data?.academicYear?.trim()
    }
  })

  if (autoApprove) {
    await createNotification({
      userId,
      type: 'MEMBERSHIP_APPROVED',
      title: 'College Community Verified',
      message: `Welcome to ${community.name}! Your institutional email was automatically verified.`,
      linkUrl: `/community`
    })
  }

  return {
    status: autoApprove ? 'APPROVED' : 'PENDING',
    message: autoApprove
      ? `Welcome to ${community.name}! Your membership is automatically approved.`
      : `Membership request submitted to ${community.name}. A college administrator will review it.`,
    membership: newMembership
  }
}

export async function listMembershipRequests(communityId: string, reviewerUserId: string) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // Authorization: must be COLLEGE_ADMIN of this community or Platform ADMIN
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = reviewer?.role === 'ADMIN' || Boolean(reviewer?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const adminMembership = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId: reviewerUserId,
        role: 'COLLEGE_ADMIN',
        status: 'APPROVED'
      }
    })
    if (!adminMembership) {
      throw new HttpError(403, 'Forbidden: Only College Administrators can review membership requests')
    }
  }

  const requests = await prisma.communityMember.findMany({
    where: {
      communityId: resolvedCommunityId,
      status: 'PENDING'
    },
    orderBy: { requestedAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          email: true,
          profession: true,
          identificationNumber: true,
          createdAt: true
        }
      }
    }
  })

  return requests
}

export async function reviewMembershipRequest(
  communityId: string,
  membershipId: string,
  reviewerUserId: string,
  data: {
    action: 'APPROVE' | 'REJECT'
    role?: CommunityRole
    rejectionReason?: string
  }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // Authorization check
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = reviewer?.role === 'ADMIN' || Boolean(reviewer?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const adminMembership = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId: reviewerUserId,
        role: 'COLLEGE_ADMIN',
        status: 'APPROVED'
      }
    })
    if (!adminMembership) {
      throw new HttpError(403, 'Forbidden: Only College Administrators can approve or reject membership requests')
    }
  }

  const target = await prisma.communityMember.findUnique({
    where: { id: membershipId },
    include: { community: true }
  })

  if (!target || target.communityId !== resolvedCommunityId) {
    throw new HttpError(404, 'Membership request not found in this community')
  }

  const newStatus: MembershipStatus = data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  const newRole: CommunityRole = data.role || target.role

  const updated = await prisma.communityMember.update({
    where: { id: membershipId },
    data: {
      status: newStatus,
      role: newRole,
      reviewedAt: new Date(),
      reviewedById: reviewerUserId,
      rejectionReason: data.action === 'REJECT' ? data.rejectionReason || 'Membership not approved by administrator' : null
    }
  })

  // Notify student
  await createNotification({
    userId: target.userId,
    type: data.action === 'APPROVE' ? 'MEMBERSHIP_APPROVED' : 'MEMBERSHIP_REJECTED',
    title: data.action === 'APPROVE' ? 'Membership Approved' : 'Membership Request Update',
    message:
      data.action === 'APPROVE'
        ? `Your membership to ${target.community.name} has been approved. You now have full access to college discussions.`
        : `Your membership request to ${target.community.name} was not approved.${data.rejectionReason ? ` Reason: ${data.rejectionReason}` : ''}`,
    linkUrl: `/community`
  })

  return updated
}

export async function listCommunityMembers(
  communityId: string,
  callerUserId: string,
  params?: { page?: number; limit?: number; search?: string }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // Strict privacy rule: Only approved members or platform admins can view member directory
  const caller = await prisma.user.findUnique({
    where: { id: callerUserId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = caller?.role === 'ADMIN' || Boolean(caller?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const approved = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId: callerUserId,
        status: 'APPROVED'
      }
    })
    if (!approved) {
      throw new HttpError(403, 'Forbidden: Community member list is private to verified college members')
    }
  }

  const page = Math.max(1, params?.page || 1)
  const limit = Math.min(50, Math.max(1, params?.limit || 20))
  const skip = (page - 1) * limit

  const where: any = {
    communityId: resolvedCommunityId,
    status: 'APPROVED'
  }

  if (params?.search?.trim()) {
    const s = params.search.trim()
    where.user = {
      OR: [
        { displayName: { contains: s, mode: 'insensitive' } },
        { username: { contains: s, mode: 'insensitive' } }
      ]
    }
  }

  const [members, total] = await Promise.all([
    prisma.communityMember.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profession: true
          }
        }
      }
    }),
    prisma.communityMember.count({ where })
  ])

  return {
    items: members,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export async function listCommunityDiscussions(
  communityId: string,
  callerUserId?: string,
  params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    subjectId?: string
  }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // CRITICAL PRIVACY RULE: Backend authorization enforcement!
  // College-only discussions must remain accessible only to authorized members and administrators.
  if (!callerUserId) {
    throw new HttpError(401, 'Authentication required to view college community discussions')
  }

  const user = await prisma.user.findUnique({
    where: { id: callerUserId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId: callerUserId,
        status: 'APPROVED'
      }
    })
    if (!membership) {
      throw new HttpError(403, 'Forbidden: College-only discussions are restricted to verified members of this community')
    }
  }

  const page = Math.max(1, params?.page || 1)
  const limit = Math.min(30, Math.max(1, params?.limit || 10))
  const skip = (page - 1) * limit

  const where: any = {
    communityId: resolvedCommunityId
  }

  if (params?.category && params.category !== 'ALL') {
    where.academicCategory = params.category
  }

  if (params?.subjectId) {
    where.subjectId = params.subjectId
  }

  if (params?.search?.trim()) {
    const s = params.search.trim()
    where.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { content: { contains: s, mode: 'insensitive' } }
    ]
  }

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profession: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true
          }
        },
        _count: {
          select: { answers: true }
        }
      }
    }),
    prisma.doubt.count({ where })
  ])

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export async function createCommunityDiscussion(
  communityId: string,
  userId: string,
  data: {
    title: string
    content: string
    subjectId: string
    academicCategory?: string
    mediaUrl?: string
    mediaType?: 'IMAGE' | 'AUDIO'
    attachments?: Array<{
      url: string
      filename: string
      fileType: 'IMAGE' | 'AUDIO'
      mimeType: string
      size: number
    }>
  }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // CRITICAL PRIVACY & ACCESS RULE: Caller must be an APPROVED member of this community or Platform ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const membership = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId,
        status: 'APPROVED'
      }
    })
    if (!membership) {
      throw new HttpError(403, 'Forbidden: You must be an approved member of this college community to post discussions')
    }
  }

  const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } })
  if (!subject) {
    throw new HttpError(400, 'Invalid subject')
  }

  let primaryMediaUrl = data.mediaUrl
  let primaryMediaType = data.mediaType
  if (!primaryMediaUrl && data.attachments && data.attachments.length > 0) {
    primaryMediaUrl = data.attachments[0].url
    primaryMediaType = data.attachments[0].fileType
  }

  const doubt = await prisma.$transaction(async (tx) => {
    const created = await tx.doubt.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        subjectId: data.subjectId,
        authorId: userId,
        communityId: resolvedCommunityId,
        isSharedWithWiderNetwork: false, // Default is STRICTLY college-only
        academicCategory: data.academicCategory || 'GENERAL_DOUBT',
        mediaUrl: primaryMediaUrl,
        mediaType: primaryMediaType
      },
      include: {
        author: {
          select: { id: true, displayName: true, username: true }
        },
        subject: {
          select: { id: true, name: true, code: true }
        },
        community: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    if (data.attachments && data.attachments.length > 0) {
      await tx.attachment.createMany({
        data: data.attachments.map((att) => ({
          url: att.url,
          filename: att.filename,
          fileType: att.fileType,
          mimeType: att.mimeType,
          size: att.size,
          uploaderId: userId,
          doubtId: created.id
        }))
      })
    }

    return created
  })

  return doubt
}

export async function shareDiscussionWithWiderNetwork(doubtId: string, userId: string) {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: { community: true }
  })

  if (!doubt) {
    throw new HttpError(404, 'Discussion not found')
  }

  // Authorization: author, college admin of that community, or platform admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))

  let isCollegeAdmin = false
  if (doubt.communityId) {
    const adminMembership = await prisma.communityMember.findFirst({
      where: {
        communityId: doubt.communityId,
        userId,
        role: 'COLLEGE_ADMIN',
        status: 'APPROVED'
      }
    })
    isCollegeAdmin = Boolean(adminMembership)
  }

  const isAuthor = doubt.authorId === userId

  if (!isAuthor && !isCollegeAdmin && !isPlatformAdmin) {
    throw new HttpError(403, 'Forbidden: Only the discussion author or college administrators can share with the wider network')
  }

  if (doubt.isSharedWithWiderNetwork) {
    return doubt
  }

  const updated = await prisma.doubt.update({
    where: { id: doubtId },
    data: {
      isSharedWithWiderNetwork: true,
      sharedAt: new Date(),
      sharedById: userId
    },
    include: {
      community: { select: { id: true, name: true, code: true, slug: true } },
      author: { select: { id: true, displayName: true, username: true } },
      subject: { select: { id: true, name: true, code: true } }
    }
  })

  // Notify original author if shared by admin
  if (!isAuthor) {
    await createNotification({
      userId: doubt.authorId,
      type: 'WIDER_NETWORK_SHARED',
      title: 'Discussion Shared with Wider Network',
      message: `Your discussion "${doubt.title}" was shared with the wider peer academic network.`,
      linkUrl: `/doubts/${doubt.id}`
    })
  }

  return updated
}

export async function unshareDiscussionFromWiderNetwork(doubtId: string, userId: string) {
  const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } })
  if (!doubt) {
    throw new HttpError(404, 'Discussion not found')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = user?.role === 'ADMIN' || Boolean(user?.email?.toLowerCase().includes('admin@'))
  const isAuthor = doubt.authorId === userId

  if (!isAuthor && !isPlatformAdmin) {
    throw new HttpError(403, 'Forbidden: Only the discussion author or platform administrators can unshare')
  }

  return prisma.doubt.update({
    where: { id: doubtId },
    data: {
      isSharedWithWiderNetwork: false
    }
  })
}

export async function listWiderNetworkDiscussions(params: {
  q?: string
  subjectId?: string
  category?: string
  collegeCode?: string
  page?: number
  limit?: number
  sortBy?: 'recent' | 'discussed' | 'resolved'
}) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(30, Math.max(1, params.limit || 12))
  const skip = (page - 1) * limit

  // Strict privacy rule: ONLY discussions explicitly shared with the wider network!
  const where: any = {
    isSharedWithWiderNetwork: true
  }

  if (params.category && params.category !== 'ALL') {
    where.academicCategory = params.category
  }

  if (params.subjectId) {
    where.subjectId = params.subjectId
  }

  if (params.collegeCode) {
    where.community = { code: params.collegeCode.toUpperCase() }
  }

  if (params.q?.trim()) {
    const s = params.q.trim()
    where.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { content: { contains: s, mode: 'insensitive' } }
    ]
  }

  let orderBy: any = { createdAt: 'desc' }
  if (params.sortBy === 'discussed') {
    orderBy = { answers: { _count: 'desc' } }
  } else if (params.sortBy === 'resolved') {
    where.isResolved = true
  }

  const [items, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        content: true,
        isResolved: true,
        academicCategory: true,
        createdAt: true,
        sharedAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            code: true,
            slug: true,
            logoUrl: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: { answers: true }
        }
      }
    }),
    prisma.doubt.count({ where })
  ])

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export async function reportContent(
  reporterId: string,
  data: { doubtId?: string; answerId?: string; reason: string; details?: string }
) {
  return prisma.discussionReport.create({
    data: {
      reporterId,
      doubtId: data.doubtId,
      answerId: data.answerId,
      reason: data.reason,
      details: data.details
    }
  })
}

export async function createAnnouncement(
  communityId: string,
  authorId: string,
  data: { title: string; content: string; priority?: string }
) {
  const community = await findCommunityRecord(communityId)
  if (!community) {
    throw new HttpError(404, 'College community not found')
  }
  const resolvedCommunityId = community.id

  // Authorization: must be COLLEGE_ADMIN or Platform ADMIN
  const caller = await prisma.user.findUnique({
    where: { id: authorId },
    select: { role: true, email: true }
  })
  const isPlatformAdmin = caller?.role === 'ADMIN' || Boolean(caller?.email?.toLowerCase().includes('admin@'))

  if (!isPlatformAdmin) {
    const adminMembership = await prisma.communityMember.findFirst({
      where: {
        communityId: resolvedCommunityId,
        userId: authorId,
        role: 'COLLEGE_ADMIN',
        status: 'APPROVED'
      }
    })
    if (!adminMembership) {
      throw new HttpError(403, 'Forbidden: Only College Administrators can post community announcements')
    }
  }

  return prisma.communityAnnouncement.create({
    data: {
      communityId: resolvedCommunityId,
      authorId,
      title: data.title.trim(),
      content: data.content.trim(),
      priority: data.priority || 'NORMAL'
    }
  })
}
