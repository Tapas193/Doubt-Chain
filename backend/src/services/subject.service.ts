import { prisma } from '../config/prisma.js'
import { HttpError } from '../middleware/errorHandler.js'

export async function listSubjects(options?: {
  q?: string
  viewerId?: string
  page?: number
  limit?: number
}) {
  const where: any = {}
  if (options?.q && options.q.trim()) {
    const q = options.q.trim()
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  }

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          doubts: true,
          members: true
        }
      },
      members: options?.viewerId
        ? {
            where: { userId: options.viewerId },
            select: { id: true }
          }
        : false
    }
  })

  return subjects.map(s => {
    const isMember = Boolean(s.members && s.members.length > 0)
    const { members, ...rest } = s as any
    return {
      ...rest,
      isMember
    }
  })
}

export async function getSubjectById(id: string, viewerId?: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          doubts: true,
          members: true
        }
      },
      members: viewerId
        ? {
            where: { userId: viewerId },
            select: { id: true }
          }
        : false
    }
  })

  if (!subject) {
    return null
  }

  const isMember = Boolean(subject.members && subject.members.length > 0)
  const { members, ...rest } = subject as any
  return {
    ...rest,
    isMember
  }
}

export async function joinSubject(id: string, userId: string, joinCode: string) {
  const subject = await prisma.subject.findUnique({
    where: { id }
  })

  if (!subject) {
    throw new HttpError(404, 'Subject not found')
  }

  const normalizedInput = joinCode.trim().toLowerCase()
  const codeMatches = subject.code.trim().toLowerCase() === normalizedInput
  const joinCodeMatches = subject.joinCode ? subject.joinCode.trim().toLowerCase() === normalizedInput : false

  if (!codeMatches && !joinCodeMatches) {
    throw new HttpError(400, 'Invalid join code for this subject')
  }

  const existing = await prisma.subjectMember.findUnique({
    where: {
      userId_subjectId: {
        userId,
        subjectId: id
      }
    }
  })

  if (existing) {
    throw new HttpError(409, 'You are already a member of this subject board')
  }

  try {
    await prisma.subjectMember.create({
      data: {
        userId,
        subjectId: id
      }
    })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new HttpError(409, 'You are already a member of this subject board')
    }
    throw err
  }

  return getSubjectById(id, userId)
}

export async function joinSubjectByCode(userId: string, joinCode: string) {
  const normalized = joinCode.trim().toLowerCase()

  const subject = await prisma.subject.findFirst({
    where: {
      OR: [
        { joinCode: { equals: normalized, mode: 'insensitive' } },
        { code: { equals: normalized, mode: 'insensitive' } }
      ]
    }
  })

  if (!subject) {
    throw new HttpError(400, 'Invalid or expired join code')
  }

  return joinSubject(subject.id, userId, joinCode)
}
