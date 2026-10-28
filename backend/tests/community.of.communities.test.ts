import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signToken } from '../src/utils/jwt.js'
import bcrypt from 'bcryptjs'

describe('Community of Communities — A Peer-to-Peer Academic Network', { timeout: 60000 }, () => {
  let collegeA: any
  let collegeB: any
  let subject: any

  let studentA: any
  let studentB: any
  let collegeAdminA: any

  let tokenStudentA: string
  let tokenStudentB: string
  let tokenCollegeAdminA: string

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPassword123!', 8)

    // Parallelize subject, collegeA, collegeB
    const [sub, colA, colB] = await Promise.all([
      prisma.subject.upsert({
        where: { code: 'CS201' },
        update: {},
        create: {
          code: 'CS201',
          name: 'Data Structures & Algorithms',
          description: 'Core DSA'
        }
      }),
      prisma.community.upsert({
        where: { code: 'IITB_TEST' },
        update: {},
        create: {
          name: 'IIT Bombay Test Hub',
          code: 'IITB_TEST',
          slug: 'iitb-test',
          description: 'IITB Academic Hub',
          emailDomain: 'iitb.test.edu'
        }
      }),
      prisma.community.upsert({
        where: { code: 'BITS_TEST' },
        update: {},
        create: {
          name: 'BITS Pilani Test Network',
          code: 'BITS_TEST',
          slug: 'bits-test',
          description: 'BITS Academic Network',
          emailDomain: 'bits.test.edu'
        }
      })
    ])

    subject = sub
    collegeA = colA
    collegeB = colB

    // Parallelize users
    const [usrA, usrB, admA] = await Promise.all([
      prisma.user.upsert({
        where: { email: 'student.a@iitb.test.edu' },
        update: {},
        create: {
          email: 'student.a@iitb.test.edu',
          username: 'studentA_test',
          displayName: 'Student A (IITB)',
          profession: 'STUDENT',
          passwordHash
        }
      }),
      prisma.user.upsert({
        where: { email: 'student.b@bits.test.edu' },
        update: {},
        create: {
          email: 'student.b@bits.test.edu',
          username: 'studentB_test',
          displayName: 'Student B (BITS)',
          profession: 'STUDENT',
          passwordHash
        }
      }),
      prisma.user.upsert({
        where: { email: 'admin.a@iitb.test.edu' },
        update: {},
        create: {
          email: 'admin.a@iitb.test.edu',
          username: 'adminA_test',
          displayName: 'College Admin A',
          profession: 'PROFESSOR',
          role: 'FACULTY',
          passwordHash
        }
      })
    ])

    studentA = usrA
    studentB = usrB
    collegeAdminA = admA

    // Parallelize memberships
    await Promise.all([
      prisma.communityMember.upsert({
        where: { userId_communityId: { userId: studentA.id, communityId: collegeA.id } },
        update: { status: 'APPROVED', role: 'STUDENT', isPrimary: true },
        create: {
          userId: studentA.id,
          communityId: collegeA.id,
          status: 'APPROVED',
          role: 'STUDENT',
          isPrimary: true
        }
      }),
      prisma.communityMember.upsert({
        where: { userId_communityId: { userId: collegeAdminA.id, communityId: collegeA.id } },
        update: { status: 'APPROVED', role: 'COLLEGE_ADMIN', isPrimary: true },
        create: {
          userId: collegeAdminA.id,
          communityId: collegeA.id,
          status: 'APPROVED',
          role: 'COLLEGE_ADMIN',
          isPrimary: true
        }
      }),
      prisma.communityMember.upsert({
        where: { userId_communityId: { userId: studentB.id, communityId: collegeB.id } },
        update: { status: 'APPROVED', role: 'STUDENT', isPrimary: true },
        create: {
          userId: studentB.id,
          communityId: collegeB.id,
          status: 'APPROVED',
          role: 'STUDENT',
          isPrimary: true
        }
      })
    ])

    tokenStudentA = signToken({ userId: studentA.id, email: studentA.email, role: 'STUDENT' })
    tokenStudentB = signToken({ userId: studentB.id, email: studentB.email, role: 'STUDENT' })
    tokenCollegeAdminA = signToken({ userId: collegeAdminA.id, email: collegeAdminA.email, role: 'FACULTY' })
  }, 60000)

  it('Scenario 1: Explore and list college communities', async () => {
    const res = await request(app).get('/api/v1/communities?limit=10')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data.items)).toBe(true)
    const codes = res.body.data.items.map((c: any) => c.code)
    expect(codes).toContain('IITB_TEST')
    expect(codes).toContain('BITS_TEST')
  })

  it('Scenario 2: Student A can retrieve their primary community via /api/v1/communities/my', async () => {
    const res = await request(app)
      .get('/api/v1/communities/my')
      .set('Authorization', `Bearer ${tokenStudentA}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.community.code).toBe('IITB_TEST')
    expect(res.body.data.membership.status).toBe('APPROVED')
  })

  let privateDoubtA: any

  it('Scenario 3: Student A can create a college-scoped academic discussion in College A', async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/discussions`)
      .set('Authorization', `Bearer ${tokenStudentA}`)
      .send({
        title: 'AVL Tree Rotation Edge Cases in CS201',
        content: 'How do double rotations (Left-Right) maintain height balance property when deleting from the root?',
        subjectId: subject.id,
        academicCategory: 'DSA'
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.communityId).toBe(collegeA.id)
    expect(res.body.data.isSharedWithWiderNetwork).toBe(false)
    privateDoubtA = res.body.data
  })

  it('Scenario 4: Authorized Student A can view College A discussions', async () => {
    const res = await request(app)
      .get(`/api/v1/communities/${collegeA.id}/discussions`)
      .set('Authorization', `Bearer ${tokenStudentA}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const titles = res.body.data.items.map((d: any) => d.title)
    expect(titles).toContain('AVL Tree Rotation Edge Cases in CS201')
  })

  it('Scenario 5: Non-member Student B CANNOT view private discussions in College A (HTTP 403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/communities/${collegeA.id}/discussions`)
      .set('Authorization', `Bearer ${tokenStudentB}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toContain('restricted to verified members')
  })

  it('Scenario 6: Non-member Student B CANNOT view private doubt by ID (HTTP 403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/doubts/${privateDoubtA.id}`)
      .set('Authorization', `Bearer ${tokenStudentB}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('Scenario 7: College-only discussion does NOT appear in the Wider Network feed', async () => {
    const res = await request(app)
      .get('/api/v1/communities/wider-network')
      .set('Authorization', `Bearer ${tokenStudentB}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const ids = res.body.data.items.map((d: any) => d.id)
    expect(ids).not.toContain(privateDoubtA.id)
  })

  it('Scenario 8: Non-member Student B CANNOT reply to private college discussion (HTTP 403)', async () => {
    const res = await request(app)
      .post(`/api/v1/doubts/${privateDoubtA.id}/answers`)
      .set('Authorization', `Bearer ${tokenStudentB}`)
      .send({ content: 'Here is an answer from BITS without being invited.' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('Scenario 9: Student B cannot share Student A discussion with wider network (HTTP 403)', async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/discussions/${privateDoubtA.id}/share`)
      .set('Authorization', `Bearer ${tokenStudentB}`)
      .send({ confirmWiderNetwork: true })

    expect(res.status).toBe(403)
  })

  it('Scenario 10: "Ask the Wider Network" — Student A explicitly shares their discussion with confirmation', async () => {
    const res = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/discussions/${privateDoubtA.id}/share`)
      .set('Authorization', `Bearer ${tokenStudentA}`)
      .send({ confirmWiderNetwork: true })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.isSharedWithWiderNetwork).toBe(true)
    expect(res.body.data.sharedAt).not.toBeNull()
  })

  it('Scenario 11: Shared discussion now appears in the Wider Network feed', async () => {
    const res = await request(app)
      .get('/api/v1/communities/wider-network')
      .set('Authorization', `Bearer ${tokenStudentB}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const ids = res.body.data.items.map((d: any) => d.id)
    expect(ids).toContain(privateDoubtA.id)
  })

  it('Scenario 12: External Student B can now view and reply to the shared discussion', async () => {
    // View detail
    const detailRes = await request(app)
      .get(`/api/v1/doubts/${privateDoubtA.id}`)
      .set('Authorization', `Bearer ${tokenStudentB}`)
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.isSharedWithWiderNetwork).toBe(true)

    // Reply
    const replyRes = await request(app)
      .post(`/api/v1/doubts/${privateDoubtA.id}/answers`)
      .set('Authorization', `Bearer ${tokenStudentB}`)
      .send({ content: 'From BITS: For left-right imbalance, perform a left rotation on the left child, followed by a right rotation on the unbalanced root.' })

    expect(replyRes.status).toBe(201)
    expect(replyRes.body.success).toBe(true)
  }, 25000)

  it('Scenario 13: Student A receives a persistent notification about the cross-college reply', async () => {
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenStudentA}`)

    expect(notifRes.status).toBe(200)
    expect(notifRes.body.success).toBe(true)
    expect(notifRes.body.data.unreadCount).toBeGreaterThan(0)
    const notifs = notifRes.body.data.items
    const widerReplyNotif = notifs.find((n: any) => n.type === 'WIDER_NETWORK_REPLY' || n.type === 'NEW_REPLY')
    expect(widerReplyNotif).toBeDefined()
  }, 25000)

  it('Scenario 14: Student can request membership and unauthorized user cannot approve', async () => {
    // Create new external student
    const studentC = await prisma.user.create({
      data: {
        email: `student.c.${Date.now()}@external.edu`,
        username: `studentC_${Date.now()}`,
        displayName: 'Student C',
        profession: 'STUDENT',
        passwordHash: 'dummy'
      }
    })
    const tokenStudentC = signToken({ userId: studentC.id, email: studentC.email, role: 'STUDENT' })

    // Request join College A
    const joinRes = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/join`)
      .set('Authorization', `Bearer ${tokenStudentC}`)
      .send({ department: 'CSE', academicYear: '3rd Year' })

    expect(joinRes.status).toBe(202)
    expect(joinRes.body.data.status).toBe('PENDING')
    const membershipId = joinRes.body.data.membership.id

    // Student B attempts to approve Student C (Unauthorized, 403)
    const hackApprove = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/requests/${membershipId}`)
      .set('Authorization', `Bearer ${tokenStudentB}`)
      .send({ action: 'APPROVE' })

    expect(hackApprove.status).toBe(403)

    // College Admin A approves Student C (Authorized, 200)
    const validApprove = await request(app)
      .post(`/api/v1/communities/${collegeA.id}/requests/${membershipId}`)
      .set('Authorization', `Bearer ${tokenCollegeAdminA}`)
      .send({ action: 'APPROVE' })

    expect(validApprove.status).toBe(200)
    expect(validApprove.body.data.status).toBe('APPROVED')
  }, 25000)

  it('Scenario 15: Community lookup resolves flexibly by slug alias (e.g. iitb-test-hub), code, or ID, and 404s when not found', async () => {
    // Lookup by iitb-test-hub alias
    const aliasRes = await request(app).get('/api/v1/communities/iitb-test-hub')
    expect(aliasRes.status).toBe(200)
    expect(aliasRes.body.success).toBe(true)
    expect(aliasRes.body.data.code).toBe('IITB_TEST')

    // Lookup by code
    const codeRes = await request(app).get('/api/v1/communities/IITB_TEST')
    expect(codeRes.status).toBe(200)
    expect(codeRes.body.data.id).toBe(collegeA.id)

    // Lookup by slug
    const slugRes = await request(app).get('/api/v1/communities/iitb-test')
    expect(slugRes.status).toBe(200)
    expect(slugRes.body.data.id).toBe(collegeA.id)

    // Lookup genuinely non-existent returns 404
    const notFoundRes = await request(app).get('/api/v1/communities/non-existent-college-slug-123')
    expect(notFoundRes.status).toBe(404)
    expect(notFoundRes.body.success).toBe(false)
  })

  it('Scenario 16: Community management requests return 403 Forbidden for unauthorized students and 200 OK for college admin', async () => {
    // Unauthorized student accessing management requests receives 403 Forbidden
    const unauthRes = await request(app)
      .get('/api/v1/communities/iitb-test-hub/requests')
      .set('Authorization', `Bearer ${tokenStudentA}`)

    expect(unauthRes.status).toBe(403)
    expect(unauthRes.body.success).toBe(false)
    expect(unauthRes.body.message).toContain('Only College Administrators')

    // Authorized college admin accessing management requests succeeds
    const adminRes = await request(app)
      .get('/api/v1/communities/iitb-test-hub/requests')
      .set('Authorization', `Bearer ${tokenCollegeAdminA}`)

    expect(adminRes.status).toBe(200)
    expect(adminRes.body.success).toBe(true)
    expect(Array.isArray(adminRes.body.data)).toBe(true)
  })
})
