import { useEffect, useState } from 'react'
import { auditLogsApi, usersApi } from '../api/client'

type Log = { id?: string; createdAt?: string; username?: string; action?: string; entityType?: string; entityId?: string }

export default function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [users, setUsers] = useState<{ id: string; username: string }[]>([])

  useEffect(() => {
    usersApi.listAll().then((r) => {
      const d = r.data as { id: string; username: string }[]
      setUsers(Array.isArray(d) ? d : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page: 0, size: 50 }
    if (action) params.action = action
    if (entityType) params.entityType = entityType
    if (userId) params.userId = userId
    if (from) params.from = from
    if (to) params.to = to
    auditLogsApi.list(params)
      .then((r) => {
        const d = r.data as { content?: Log[] }
        setLogs(Array.isArray(d?.content) ? d.content : [])
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [action, entityType, userId, from, to])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Audit Logs</h1>
      <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <input type="text" placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} className="px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white w-40" />
        <input type="text" placeholder="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)} className="px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white w-40" />
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white w-40">
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
        <span className="py-2 text-slate-500">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Action</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id ?? i} className="border-b border-slate-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">{l.createdAt}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{l.username ?? '-'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm">{l.action}</span></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.entityType} {l.entityId ? `#${l.entityId}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
