import { prisma } from '../config/prisma.js'
import { NotificationType } from '@prisma/client'

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  metadata?: any
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl,
        metadata: input.metadata || null
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ])
  return { items, unreadCount }
}

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  })
}
