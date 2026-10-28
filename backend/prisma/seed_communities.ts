import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedCommunities() {
  const communities = [
    {
      name: 'IIT Bombay Academic Community',
      code: 'IITB',
      slug: 'iit-bombay',
      description: 'Official academic collaboration hub for IIT Bombay students and faculty. Discuss coursework, algorithms, systems, and research.',
      emailDomain: 'iitb.ac.in',
      department: 'Computer Science and Engineering',
      academicYear: '2026-2027',
      location: 'Powai, Mumbai, MH, India',
      isVerified: true
    },
    {
      name: 'BITS Pilani Academic Network',
      code: 'BITS',
      slug: 'bits-pilani',
      description: 'Peer-to-peer technical exchange, coursework discussions, and project collaboration across BITS campuses.',
      emailDomain: 'bits-pilani.ac.in',
      department: 'Computer Science & Information Systems',
      academicYear: '2026-2027',
      location: 'Pilani, Rajasthan, India',
      isVerified: true
    },
    {
      name: 'Stanford Engineering Network',
      code: 'STANFORD',
      slug: 'stanford-engineering',
      description: 'Stanford School of Engineering student community. Distributed systems, AI/ML theory, and advanced software engineering.',
      emailDomain: 'stanford.edu',
      department: 'School of Engineering',
      academicYear: '2026-2027',
      location: 'Stanford, California, USA',
      isVerified: true
    },
    {
      name: 'MIT EECS Collaborative',
      code: 'MIT',
      slug: 'mit-eecs',
      description: 'Massachusetts Institute of Technology Electrical Engineering & Computer Science peer learning network.',
      emailDomain: 'mit.edu',
      department: 'EECS',
      academicYear: '2026-2027',
      location: 'Cambridge, Massachusetts, USA',
      isVerified: true
    }
  ]

  for (const c of communities) {
    await prisma.community.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        emailDomain: c.emailDomain,
        department: c.department,
        academicYear: c.academicYear,
        location: c.location,
        isVerified: c.isVerified
      },
      create: c
    })
  }

  console.log('College communities seeded successfully.')
}

if (process.argv[1]?.endsWith('seed_communities.ts')) {
  seedCommunities()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
