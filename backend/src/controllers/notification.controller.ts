import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { ok } from '../utils/http.js'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notification.service.js'

export async function list(req: AuthRequest, res: Response) {
  const result = await getUserNotifications(req.user!.userId)
  res.json(ok(result))
}

export async function markRead(req: AuthRequest, res: Response) {
  await markNotificationAsRead(req.params.id, req.user!.userId)
  res.json(ok({ success: true }, 'Notification marked as read'))
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await markAllNotificationsAsRead(req.user!.userId)
  res.json(ok({ success: true }, 'All notifications marked as read'))
}
