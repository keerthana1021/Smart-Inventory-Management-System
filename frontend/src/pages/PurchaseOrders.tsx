import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { purchaseOrdersApi, suppliersApi } from '../api/client'
import ProductPicker from '../components/ProductPicker'

interface Order {
  id?: string | number
  orderNumber?: string
  supplierName?: string
  supplier?: { name: string }
  status?: string
  totalAmount?: number
}

export default function PurchaseOrders() {
  const { user } = useAuth()
  const canCreate = user?.roles?.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [createSupplierId, setCreateSupplierId] = useState('')
  const [createItems, setCreateItems] = useState<{ productId: string; quantity: number; unitPrice?: number }[]>([{ productId: '', quantity: 1 }])
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadOrders = (nextPage = page) => {
    setError(null)
    purchaseOrdersApi.list({ page: nextPage, size: 20 })
      .then((r) => {
        const data = r.data as { content?: Order[]; totalPages?: number }
        setOrders(Array.isArray(data?.content) ? data.content : [])
        setTotalPages(data?.totalPages ?? 0)
      })
      .catch((err) => {
        setOrders([])
        const status = err.response?.status
        const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message
        if (status === 403) setError('You don’t have permission to view purchase orders.')
        else if (status === 500) setError('Server error loading purchase orders. Restart the backend and try again.')
        else if (msg) setError(`Failed to load purchase orders: ${msg}`)
        else setError('Failed to load purchase orders. Check that the backend is running on port 8080.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders(page)
  }, [page])

  useEffect(() => {
    if (showCreate) {
      suppliersApi.list({ size: 200 }).then((r) => {
        const d = r.data as { content?: { id: string; name: string }[] }
        setSuppliers(Array.isArray(d?.content) ? d.content : [])
      }).catch(() => setSuppliers([]))
    }
  }, [showCreate])

  const addLine = () => setCreateItems((prev) => [...prev, { productId: '', quantity: 1 }])
  const removeLine = (index: number) => setCreateItems((prev) => prev.filter((_, i) => i !== index))
  const updateLine = (index: number, field: 'productId' | 'quantity' | 'unitPrice', value: string | number) => {
    setCreateItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const updateLineProduct = (index: number, product: { id: string; sku: string; name: string; unitPrice?: number } | null) => {
    setCreateItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], productId: product?.id ?? '', unitPrice: product?.unitPrice }
      return next
    })
  }

  const submitCreate = () => {
    const items = createItems.filter((i) => i.productId && i.quantity > 0)
    if (!createSupplierId || items.length === 0) {
      setCreateError('Select a supplier and add at least one product with quantity.')
      return
    }
    setCreateError(null)
    setCreateSubmitting(true)
    purchaseOrdersApi.create({
      supplierId: createSupplierId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })
      .then(() => {
        setShowCreate(false)
        setCreateSupplierId('')
        setCreateItems([{ productId: '', quantity: 1 }])
        loadOrders()
      })
      .catch((err) => {
        setCreateError(err.response?.data?.message || err.message || 'Failed to create order.')
      })
      .finally(() => setCreateSubmitting(false))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Purchase Orders</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
          >
            {showCreate ? 'Cancel' : 'Create Purchase Order'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New Purchase Order</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
            <select
              value={createSupplierId}
              onChange={(e) => setCreateSupplierId(e.target.value)}
              className="w-full max-w-md px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Line items</label>
              <button type="button" onClick={addLine} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Add line</button>
            </div>
            <div className="space-y-2">
              {createItems.map((line, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                  <ProductPicker
                    value={line.productId}
                    onChange={(p) => updateLineProduct(idx, p)}
                    placeholder="Search product..."
                  />
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                    className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    placeholder="Qty"
                  />
                  <button type="button" onClick={() => removeLine(idx)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
          {createError && <p className="text-red-600 dark:text-red-400 text-sm">{createError}</p>}
          <button
            type="button"
            onClick={submitCreate}
            disabled={createSubmitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {createSubmitting ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading && <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>}
        {!loading && error && <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No purchase orders yet. Use &quot;Create Purchase Order&quot; above to add one (you need at least one supplier and some products).
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Order #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Supplier</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Total</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={String(o.id ?? i)} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3">
                    <Link to={`/purchase-orders/${o.id}`} className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{o.supplierName ?? o.supplier?.name ?? '-'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 text-sm">{o.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums">₹{Number(o.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    {canCreate && o.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => purchaseOrdersApi.approve(String(o.id)).then(() => loadOrders()).catch((e) => setError(e.response?.data?.message || 'Approve failed'))} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mr-2">Approve</button>
                        <button onClick={() => purchaseOrdersApi.reject(String(o.id)).then(() => loadOrders()).catch((e) => setError(e.response?.data?.message || 'Reject failed'))} className="text-red-600 dark:text-red-400 hover:underline text-sm">Reject</button>
                      </>
                    )}
                    {canCreate && o.status === 'APPROVED' && (
                      <>
                        <button onClick={() => purchaseOrdersApi.receive(String(o.id)).then(() => loadOrders()).catch((e) => setError(e.response?.data?.message || 'Receive failed'))} className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm mr-2">Receive</button>
                        <button onClick={() => purchaseOrdersApi.reject(String(o.id)).then(() => loadOrders()).catch((e) => setError(e.response?.data?.message || 'Reject failed'))} className="text-red-600 dark:text-red-400 hover:underline text-sm">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700">Prev</button>
            <span className="py-2">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
