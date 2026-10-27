import { prisma } from '../config/prisma.js'

export async function listSubjects() {
  return prisma.subject.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getSubjectById(id: string) {
  return prisma.subject.findUnique({
    where: { id },
    include: {
      _count: {
        select: { doubts: true }
      }
    }
  })
}
