import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { salesOrdersApi } from '../api/client'
import ProductPicker from '../components/ProductPicker'

function OrderStatusActions({ order, onSuccess, canAct }: { order: { id?: string | number; status?: string }; onSuccess: () => void; canAct?: boolean }) {
  if (!canAct) return <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const id = order.id ? String(order.id) : ''
  const status = order.status || ''

  const run = (fn: () => Promise<unknown>) => {
    setErr(null)
    setLoading(true)
    fn()
      .then(onSuccess)
      .catch((e) =>
        setErr(
          e.response?.data?.message ||
            e.response?.data?.error ||
            e.message ||
            'Failed'
        )
      )
      .finally(() => setLoading(false))
  }

  if (!id || status === 'DELIVERED' || status === 'CANCELLED') return <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {status === 'PENDING' && (
        <button onClick={() => run(() => salesOrdersApi.confirm(id))} disabled={loading} className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/70 disabled:opacity-50">
          {loading ? '…' : 'Confirm'}
        </button>
      )}
      {status === 'CONFIRMED' && (
        <button onClick={() => run(() => salesOrdersApi.ship(id))} disabled={loading} className="text-sm px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 disabled:opacity-50">
          {loading ? '…' : 'Mark Shipped'}
        </button>
      )}
      {status === 'SHIPPED' && (
        <button onClick={() => run(() => salesOrdersApi.deliver(id))} disabled={loading} className="text-sm px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/70 disabled:opacity-50">
          {loading ? '…' : 'Mark Delivered'}
        </button>
      )}
      {err && <span className="text-red-600 dark:text-red-400 text-xs">{err}</span>}
    </div>
  )
}

interface Order {
  id?: string | number
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  status?: string
  totalAmount?: number
}

export default function SalesOrders() {
  const { user } = useAuth()
  const canCreate = user?.roles?.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createItems, setCreateItems] = useState<{ productId: string; quantity: number; unitPrice?: number }[]>([{ productId: '', quantity: 1 }])
  const [createCustomerName, setCreateCustomerName] = useState('')
  const [createCustomerEmail, setCreateCustomerEmail] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadOrders = () => {
    setError(null)
    salesOrdersApi.list({ page: 0, size: 50 })
      .then((r) => {
        const data = r.data as { content?: Order[] }
        setOrders(Array.isArray(data?.content) ? data.content : [])
      })
      .catch((err) => {
        setOrders([])
        const msg = err.response?.data?.message ?? err.response?.data?.error ?? err.message
        setError(msg || 'Failed to load sales orders.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

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
    if (items.length === 0) {
      setCreateError('Add at least one product with quantity.')
      return
    }
    setCreateError(null)
    setCreateSubmitting(true)
    salesOrdersApi.create({
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      customerName: createCustomerName || undefined,
      customerEmail: createCustomerEmail || undefined,
    })
      .then(() => {
        setShowCreate(false)
        setCreateItems([{ productId: '', quantity: 1 }])
        setCreateCustomerName('')
        setCreateCustomerEmail('')
        loadOrders()
      })
      .catch((err) => {
        setCreateError(err.response?.data?.message || err.message || 'Failed to create sales order.')
      })
      .finally(() => setCreateSubmitting(false))
  }

  const list = Array.isArray(orders) ? orders : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Sales Orders</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
        >
          {showCreate ? 'Cancel' : 'Create Sales Order'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">New Sales Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer name (optional)</label>
              <input
                type="text"
                value={createCustomerName}
                onChange={(e) => setCreateCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer email (optional)</label>
              <input
                type="email"
                value={createCustomerEmail}
                onChange={(e) => setCreateCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="customer@example.com"
              />
            </div>
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
            {createSubmitting ? 'Creating…' : 'Create Sales Order'}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading && <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>}
        {!loading && error && <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && list.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No sales orders yet. Use &quot;Create Sales Order&quot; above to add one (you need products in inventory).
          </div>
        )}
        {!loading && !error && list.length > 0 && (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Order #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Total</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o, i) => (
                <tr key={String(o.id ?? i)} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{o.customerName ?? o.customerEmail ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={'px-2 py-0.5 rounded text-sm ' + (o.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : o.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200' : o.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200')}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums">₹{Number(o.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                    <OrderStatusActions order={o} onSuccess={loadOrders} canAct={canCreate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
