import { useEffect, useState } from 'react'
import { categoriesApi } from '../api/client'

type Category = { id?: string | number; name?: string; description?: string }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    categoriesApi.list({ search: search || undefined, size: 100 })
      .then((r) => setCategories((r.data as { content: Category[] }).content || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [search])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    categoriesApi.create({ name: formName.trim(), description: formDesc.trim() || undefined })
      .then(() => {
        setFormName('')
        setFormDesc('')
        setShowForm(false)
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!editName.trim()) return
    setSubmitting(true)
    categoriesApi.update(id, { name: editName.trim(), description: editDesc.trim() || undefined })
      .then(() => {
        setEditingId(null)
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const startEdit = (c: Category) => {
    setEditingId(String(c.id))
    setEditName(c.name || '')
    setEditDesc(c.description || '')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Categories</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          Add category
        </button>
      </div>
      <input
        type="search"
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
      />
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-3 max-w-md text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New category</h2>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Name"
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <input
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id ?? i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  {editingId === String(c.id) ? (
                    <td colSpan={3} className="px-4 py-3">
                      <form onSubmit={(e) => handleUpdate(e, String(c.id))} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Name</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Description</label>
                          <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{c.description || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(c)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && categories.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">No categories found.</div>
        )}
      </div>
    </div>
  )
}
