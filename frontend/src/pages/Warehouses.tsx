import { useEffect, useState } from 'react'
import { warehousesApi } from '../api/client'

type Warehouse = { id?: string; name: string; code?: string; address?: string }

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Warehouse>({ name: '', code: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    warehousesApi.listAll()
      .then((r) => setWarehouses(Array.isArray(r.data) ? (r.data as Warehouse[]) : []))
      .catch(() => setWarehouses([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    warehousesApi.create(form)
      .then(() => {
        setForm({ name: '', code: '', address: '' })
        setShowForm(false)
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const handleUpdate = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    setSubmitting(true)
    warehousesApi.update(id, form)
      .then(() => {
        setEditingId(null)
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const startEdit = (w: Warehouse) => {
    setEditingId(w.id || null)
    setForm({ name: w.name || '', code: w.code || '', address: w.address || '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Warehouses</h1>
        <button onClick={() => { setShowForm(true); setForm({ name: '', code: '', address: '' }); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add warehouse</button>
      </div>
      {showForm && !editingId && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-w-md text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New warehouse</h2>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code</label><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label><input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" /></div>
          <div className="flex gap-2"><button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100">Cancel</button></div>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading ? <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div> : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Code</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Address</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  {editingId === w.id ? (
                    <td colSpan={4} className="px-4 py-3">
                      <form onSubmit={(e) => handleUpdate(e, w.id!)} className="flex gap-3 flex-wrap">
                        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                        <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                        <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm flex-1 min-w-[120px]" />
                        <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{w.name}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-mono">{w.code || '-'}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{w.address || '-'}</td>
                      <td className="px-4 py-3"><button onClick={() => startEdit(w)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit</button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && warehouses.length === 0 && <div className="p-8 text-center text-slate-600 dark:text-slate-400">No warehouses yet.</div>}
      </div>
    </div>
  )
}
