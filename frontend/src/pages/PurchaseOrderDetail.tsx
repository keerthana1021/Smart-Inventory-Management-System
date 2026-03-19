import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { purchaseOrdersApi } from '../api/client'

type PODetail = {
  id?: string
  orderNumber?: string
  supplierName?: string
  status?: string
  totalAmount?: number
  createdAt?: string
  items?: Array<{ productId?: string; productSku?: string; productName?: string; quantity?: number; unitPrice?: number; lineTotal?: number }>
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<PODetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadOrder = () => {
    if (!id) return
    setLoading(true)
    setError(null)
    purchaseOrdersApi.get(id)
      .then((r) => setOrder(r.data as PODetail))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const runAction = (action: 'approve' | 'receive' | 'reject') => {
    if (!id) return
    setActionLoading(action)
    const fn = action === 'approve' ? purchaseOrdersApi.approve : action === 'receive' ? purchaseOrdersApi.receive : purchaseOrdersApi.reject
    fn(id)
      .then(loadOrder)
      .catch((e) => setError(e.response?.data?.message || 'Action failed'))
      .finally(() => setActionLoading(null))
  }

  if (loading) return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
  if (error || !order) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error || 'Order not found'}</div>

  const canApprove = order.status === 'PENDING_APPROVAL'
  const canReceive = order.status === 'APPROVED'
  const canReject = order.status === 'PENDING_APPROVAL' || order.status === 'APPROVED'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/purchase-orders" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">← Back to Purchase Orders</Link>
          <h1 className="text-2xl font-semibold text-black dark:text-slate-100">{order.orderNumber}</h1>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <button onClick={() => runAction('approve')} disabled={!!actionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm">
              {actionLoading === 'approve' ? '…' : 'Approve'}
            </button>
          )}
          {canReceive && (
            <button onClick={() => runAction('receive')} disabled={!!actionLoading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm">
              {actionLoading === 'receive' ? '…' : 'Receive'}
            </button>
          )}
          {canReject && (
            <button onClick={() => runAction('reject')} disabled={!!actionLoading} className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-sm">
              {actionLoading === 'reject' ? '…' : 'Reject'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Order Details</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-600 dark:text-slate-400">Supplier</dt><dd className="text-slate-900 dark:text-slate-100">{order.supplierName || '-'}</dd></div>
          <div><dt className="text-slate-600 dark:text-slate-400">Status</dt><dd><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">{order.status}</span></dd></div>
          <div><dt className="text-slate-600 dark:text-slate-400">Total</dt><dd className="font-medium tabular-nums text-slate-900 dark:text-slate-100">₹{Number(order.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd></div>
          <div><dt className="text-slate-600 dark:text-slate-400">Created</dt><dd className="text-slate-800 dark:text-slate-200">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</dd></div>
        </dl>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 p-4 border-b border-slate-200 dark:border-slate-700">Line Items</h2>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Product</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Qty</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Unit Price</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="px-4 py-3">
                  <Link to={`/inventory/${item.productId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{item.productSku || item.productId} – {item.productName || '-'}</Link>
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">{item.quantity}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">₹{Number(item.unitPrice ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">₹{Number(item.lineTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
