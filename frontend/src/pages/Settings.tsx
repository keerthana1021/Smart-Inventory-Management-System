import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { settingsApi } from '../api/client'

type Setting = { settingKey: string; settingValue?: string; description?: string }

export default function Settings() {
  const outletCtx = useOutletContext<{ openChangePassword: () => void }>()
  const openChangePassword = outletCtx?.openChangePassword

  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    settingsApi.list()
      .then((r) => setSettings(Array.isArray(r.data) ? (r.data as Setting[]) : []))
      .catch(() => setSettings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdate = (e: React.FormEvent, key: string) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    settingsApi.update(key, { settingValue: editValue })
      .then(() => {
        setEditingKey(null)
        load()
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to update. Admin access required.')
      })
      .finally(() => setSubmitting(false))
  }

  const startEdit = (s: Setting) => {
    setEditingKey(s.settingKey)
    setEditValue(s.settingValue ?? '')
  }

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <button
          onClick={() => openChangePassword?.()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Change Password
        </button>
      </div>
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">System Settings</h1>
      <p className="text-slate-600 dark:text-slate-400">Tax rates, currency, warehouse location, reorder defaults. Admin can edit values.</p>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
        ) : settings.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No settings configured. Add keys via API or DB.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Key</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Value</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  {editingKey === s.settingKey ? (
                    <td colSpan={4} className="px-4 py-3">
                      <form onSubmit={(e) => handleUpdate(e, s.settingKey)} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Value for {s.settingKey}</label>
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingKey(null)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{s.settingKey}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{s.settingValue ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.description ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(s)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
