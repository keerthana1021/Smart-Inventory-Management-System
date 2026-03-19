import { useEffect, useState } from 'react'
import { usersApi, authApi } from '../api/client'

type User = {
  id: string
  username: string
  email?: string
  fullName?: string
  enabled: boolean
  roles: string[]
}

const ROLES = ['ADMIN', 'MANAGER', 'STAFF']

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    enabled: true,
    roles: [] as string[],
  })
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
    enabled: true,
    password: '',
    roles: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUserId || !resetPassword || resetPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setResetSubmitting(true)
    authApi.adminResetPassword(resetUserId, resetPassword)
      .then(() => {
        setResetUserId(null)
        setResetPassword('')
        load()
      })
      .catch((err) => setError(err.response?.data?.message || 'Reset failed'))
      .finally(() => setResetSubmitting(false))
  }

  const load = () => {
    setLoading(true)
    usersApi.list({ search: search || undefined, page: 0, size: 100 })
      .then((r) => setUsers((r.data as { content: User[] }).content || []))
      .catch((err) => {
        setUsers([])
        if (err.response?.status === 403) setError('Admin access required.')
        else setError(err.response?.data?.message || 'Failed to load users.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
      setError('Username and password are required.')
      return
    }
    setError(null)
    setSubmitting(true)
    usersApi.create({
      username: form.username.trim(),
      password: form.password,
      email: form.email || undefined,
      fullName: form.fullName || undefined,
      enabled: form.enabled,
      roles: form.roles.length ? form.roles : undefined,
    })
      .then(() => {
        setForm({ username: '', password: '', email: '', fullName: '', enabled: true, roles: [] })
        setShowForm(false)
        load()
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to create user.'))
      .finally(() => setSubmitting(false))
  }

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload: { email?: string; fullName?: string; enabled?: boolean; roles?: string[]; password?: string } = {
      email: editForm.email || undefined,
      fullName: editForm.fullName || undefined,
      enabled: editForm.enabled,
      roles: editForm.roles,
    }
    if (editForm.password) payload.password = editForm.password
    usersApi.update(id, payload)
      .then(() => {
        setEditingId(null)
        load()
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to update user.'))
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return
    setError(null)
    usersApi.delete(id)
      .then(() => load())
      .catch((err) => setError(err.response?.data?.message || 'Failed to delete user.'))
  }

  const toggleRole = (role: string, isCreate: boolean) => {
    if (isCreate) {
      setForm((f) => ({
        ...f,
        roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      }))
    } else {
      setEditForm((f) => ({
        ...f,
        roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      }))
    }
  }

  const startEdit = (u: User) => {
    setEditingId(u.id)
    setEditForm({
      email: u.email || '',
      fullName: u.fullName || '',
      enabled: u.enabled,
      password: '',
      roles: u.roles || [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">User Management</h1>
        <button
          onClick={() => { setShowForm(true); setError(null); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          Add user
        </button>
      </div>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}
      <input
        type="search"
        placeholder="Search by username, name, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
      />
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-w-md text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New user</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username *</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roles</label>
            <div className="flex gap-3">
              {ROLES.map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(r)}
                    onChange={() => toggleRole(r, true)}
                  />
                  <span className="text-sm text-slate-800 dark:text-slate-200">{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-800 dark:text-slate-200">Enabled</label>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100">
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Username</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Full name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Roles</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Enabled</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  {editingId === u.id ? (
                    <td colSpan={6} className="px-4 py-3">
                      <form onSubmit={(e) => handleUpdate(e, u.id)} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400">Email</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                              className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400">Full name</label>
                            <input
                              value={editForm.fullName}
                              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                              className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400">New password (leave blank to keep)</label>
                            <input
                              type="password"
                              value={editForm.password}
                              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                              placeholder="Optional"
                              className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-slate-400">Roles</label>
                            <div className="flex gap-2 mt-1">
                              {ROLES.map((r) => (
                                <label key={r} className="flex items-center gap-1 text-sm text-slate-800 dark:text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={editForm.roles.includes(r)}
                                    onChange={() => toggleRole(r, false)}
                                  />
                                  {r}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-800 dark:text-slate-200">Enabled</label>
                            <input
                              type="checkbox"
                              checked={editForm.enabled}
                              onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{u.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{u.fullName || '-'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{u.roles?.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{u.enabled ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setResetUserId(u.id); setResetPassword(''); setError(null); }}
                          className="text-amber-600 dark:text-amber-400 hover:underline text-sm mr-3"
                        >
                          Reset password
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="text-red-600 dark:text-red-400 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No users found.</div>
        )}
      </div>

      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !resetSubmitting && setResetUserId(null)}>
          <form onSubmit={handleResetPassword} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Reset Password</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Set a new password for this user (min 6 characters).</p>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password"
              minLength={6}
              required
              className="w-full px-4 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={resetSubmitting} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">Reset</button>
              <button type="button" onClick={() => setResetUserId(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
