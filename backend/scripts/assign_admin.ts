import { PrismaClient, CommunityRole, MembershipStatus } from '@prisma/client'
import { findCommunityRecord } from '../src/services/community.service.js'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Doubt-Chain Local Development Community Administration Utility
=============================================================
Usage:
  npx tsx scripts/assign_admin.ts <userEmailOrUsername> <communitySlugOrCode> [COLLEGE_ADMIN|MODERATOR|STUDENT]
  npx tsx scripts/assign_admin.ts <userEmailOrUsername> --platform-admin
  npx tsx scripts/assign_admin.ts --approve <userEmailOrUsername> <communitySlugOrCode>

Examples:
  npx tsx scripts/assign_admin.ts tapasmishra1903@gmail.com iitb-test COLLEGE_ADMIN
  npx tsx scripts/assign_admin.ts tapasmishra1903@gmail.com --platform-admin
  npx tsx scripts/assign_admin.ts --approve tapasmishra1903@gmail.com iitb-test
`)
    return
  }

  // Subcommand: approve pending membership
  if (args[0] === '--approve') {
    const userIdentifier = args[1]
    const communityIdentifier = args[2]

    if (!userIdentifier || !communityIdentifier) {
      console.error('Error: Provide user email/username and community slug/code.')
      process.exit(1)
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: userIdentifier }, { username: userIdentifier }, { id: userIdentifier }]
      }
    })

    if (!user) {
      console.error(`Error: User "${userIdentifier}" not found.`)
      process.exit(1)
    }

    const community = await findCommunityRecord(communityIdentifier)
    if (!community) {
      console.error(`Error: Community "${communityIdentifier}" not found.`)
      process.exit(1)
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: community.id
        }
      }
    })

    if (!membership) {
      console.error(`Error: No membership record found for user "${user.email}" in "${community.name}".`)
      process.exit(1)
    }

    const updated = await prisma.communityMember.update({
      where: { id: membership.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date()
      }
    })

    console.log(`\n✅ Approved membership for ${user.displayName || user.username} (${user.email}) in community "${community.name}" [${community.code}]. Status is now APPROVED.\n`)
    return
  }

  const userIdentifier = args[0]
  const target = args[1]
  const roleInput = args[2] as CommunityRole | undefined

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: userIdentifier }, { username: userIdentifier }, { id: userIdentifier }]
    }
  })

  if (!user) {
    console.error(`Error: User "${userIdentifier}" not found.`)
    process.exit(1)
  }

  // Grant platform admin
  if (target === '--platform-admin') {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    })
    console.log(`\n✅ Assigned Platform ADMIN role to user: ${updated.displayName} (${updated.email})\n`)
    return
  }

  if (!target) {
    console.error('Error: Please specify a community code/slug or --platform-admin.')
    process.exit(1)
  }

  const community = await findCommunityRecord(target)
  if (!community) {
    console.error(`Error: Community "${target}" not found.`)
    process.exit(1)
  }

  const role: CommunityRole = (roleInput as CommunityRole) || 'COLLEGE_ADMIN'

  const membership = await prisma.communityMember.upsert({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    },
    update: {
      role,
      status: 'APPROVED',
      isPrimary: true,
      reviewedAt: new Date()
    },
    create: {
      userId: user.id,
      communityId: community.id,
      role,
      status: 'APPROVED',
      isPrimary: true
    }
  })

  console.log(`\n✅ Success: Assigned ${user.displayName || user.username} (${user.email}) as ${membership.role} in "${community.name}" [${community.code}]. Status: ${membership.status}.\n`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
