import { useState, useEffect, useRef } from 'react'
import { Bell, Check, ExternalLink, ShieldCheck, MessageSquare, Globe, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notificationService } from '../services/notificationService'
import { Notification } from '../types/api'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const data = await notificationService.list()
      setNotifications(data.items || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 20000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleItemClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await notificationService.markRead(notif.id)
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (err) {
        console.error(err)
      }
    }
    setIsOpen(false)
  }

  if (!user) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP_APPROVED':
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />
      case 'WIDER_NETWORK_REPLY':
      case 'WIDER_NETWORK_SHARED':
        return <Globe className="h-4 w-4 text-dc-blue" />
      case 'NEW_REPLY':
        return <MessageSquare className="h-4 w-4 text-purple-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-amber-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-dc-border bg-dc-card text-dc-subtext transition-colors hover:border-dc-blue/40 hover:text-dc-text"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-dc-red px-1 text-[9px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-dc-border bg-dc-bg2 p-3 shadow-2xl z-50 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-dc-border pb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dc-text uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-dc-blue/15 px-2 py-0.5 text-[10px] font-semibold text-dc-blue">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-dc-subtext hover:text-dc-blue transition-colors"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-dc-border/30">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-dc-subtext">
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                    n.isRead ? 'opacity-70 hover:opacity-100 hover:bg-dc-card' : 'bg-dc-card hover:bg-dc-card/80 border border-dc-blue/20'
                  }`}
                >
                  <div className="mt-0.5 rounded-lg bg-dc-bg p-1.5 border border-dc-border shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-dc-text truncate">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-dc-subtext line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-dc-subtext/60 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {n.linkUrl && (
                    <Link
                      to={n.linkUrl}
                      className="p-1 text-dc-subtext hover:text-dc-blue opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Open discussion link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
