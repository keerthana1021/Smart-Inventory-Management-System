import { useEffect, useState } from 'react'
import { suppliersApi } from '../api/client'

type Sup = { id?: string; name: string; contactPerson?: string; email?: string; phone?: string; address?: string }

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Sup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Sup>({ name: '', contactPerson: '', email: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    suppliersApi.list({ size: 100 })
      .then((r) => setSuppliers((r.data as { content: Sup[] }).content || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setError(null)
    setSubmitting(true)
    suppliersApi.create(form)
      .then(() => {
        setForm({ name: '', contactPerson: '', email: '', phone: '', address: '' })
        setShowForm(false)
        load()
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to create supplier.'))
      .finally(() => setSubmitting(false))
  }

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    suppliersApi.update(id, form)
      .then(() => {
        setEditingId(null)
        load()
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to update supplier.'))
      .finally(() => setSubmitting(false))
  }

  const startEdit = (s: Sup) => {
    setEditingId(s.id || null)
    setForm({
      name: s.name || '',
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Suppliers</h1>
        <button
          onClick={() => { setShowForm(true); setForm({ name: '', contactPerson: '', email: '', phone: '', address: '' }); setError(null); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          Add supplier
        </button>
      </div>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}
      {showForm && !editingId && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-w-md text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New supplier</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact person</label>
            <input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100">Cancel</button>
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id || s.name} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  {editingId === s.id ? (
                    <td colSpan={5} className="px-4 py-3">
                      <form onSubmit={(e) => handleUpdate(e, s.id!)} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs text-slate-600 dark:text-slate-400">Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" /></div>
                          <div><label className="block text-xs text-slate-600 dark:text-slate-400">Contact</label><input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" /></div>
                          <div><label className="block text-xs text-slate-600 dark:text-slate-400">Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" /></div>
                          <div><label className="block text-xs text-slate-600 dark:text-slate-400">Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" /></div>
                          <div className="col-span-2"><label className="block text-xs text-slate-600 dark:text-slate-400">Address</label><input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" /></div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{s.contactPerson || '-'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{s.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{s.phone || '-'}</td>
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
        {!loading && suppliers.length === 0 && <div className="p-8 text-center text-slate-600 dark:text-slate-400">No suppliers found.</div>}
      </div>
    </div>
  )
}
