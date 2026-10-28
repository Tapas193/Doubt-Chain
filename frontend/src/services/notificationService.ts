import { api } from '../lib/apiClient'
import { Notification } from '../types/api'

export const notificationService = {
  list: () => {
    return api.get<{ items: Notification[]; unreadCount: number }>('/notifications')
  },
  markRead: (id: string) => {
    return api.post(`/notifications/${id}/read`)
  },
  markAllRead: () => {
    return api.post('/notifications/read-all')
  }
}
