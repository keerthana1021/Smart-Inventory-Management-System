import { useEffect, useState } from 'react'
import { api } from '../api/client'

type NotificationItem = {
  id?: string | number
  title?: string
  message?: string
  type?: string
  createdAt?: string
  read?: boolean
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const r = await api.get('/notifications', { params: { size: 50 } })
        const raw = r.data as { content?: NotificationItem[] } | NotificationItem[]
        const list = Array.isArray(raw) ? raw : (raw.content ?? [])
        if (cancelled) return

        const normalized = Array.isArray(list) ? list : []
        setNotifications(normalized)

        const unread = normalized.filter((n) => !n.read && n.id != null)
        if (unread.length) {
          await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}/read`)))
          if (cancelled) return
          const unreadIds = new Set(unread.map((n) => String(n.id)))
          setNotifications((prev) => prev.map((n) => (n.id != null && unreadIds.has(String(n.id)) ? { ...n, read: true } : n)))
        }
      } catch {
        if (!cancelled) setNotifications([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const list = notifications

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Notifications</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 text-slate-900 dark:text-slate-100">
        {loading ? <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div> : list.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No notifications.</div>
        ) : (
          list.map((n, i) => (
            <div key={String(n.id ?? i)} className={`p-4 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{n.createdAt}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs">{n.type}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
