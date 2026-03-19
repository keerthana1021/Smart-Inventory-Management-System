import { useEffect, useState } from 'react'
import { ledgerApi } from '../api/client'

type Tx = {
  transactionDate?: string
  productId?: string
  productSku?: string
  product?: { sku: string }
  transactionType?: string
  quantity?: number
  referenceType?: string
  referenceId?: string | number
}

export default function Ledger() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    setError(null)
    ledgerApi.list({ page, size: 50 })
      .then((r) => {
        const d = r.data as { content?: Tx[]; totalPages?: number }
        setTxs(Array.isArray(d?.content) ? d.content : Array.isArray(r.data) ? r.data : [])
        setTotalPages(d?.totalPages ?? 0)
      })
      .catch((err) => {
        setTxs([])
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load ledger.')
      })
      .finally(() => setLoading(false))
  }, [page])

  const productDisplay = (t: Tx) => t.productSku ?? t.product?.sku ?? t.productId ?? '-'
  const qtyDisplay = (t: Tx) => t.quantity != null ? (Number(t.quantity) < 0 ? t.quantity : `+${t.quantity}`) : '-'

  const typeBadgeClass = (type?: string) => {
    const u = (type ?? '').toUpperCase()
    if (u === 'OUT')
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/45 dark:text-blue-200'
    if (u === 'IN')
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-200'
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
  }

  const qtyClass = (t: Tx) => {
    if (t.quantity == null) return 'text-slate-500 dark:text-slate-400'
    return Number(t.quantity) < 0
      ? 'text-red-700 dark:text-red-300 font-medium tabular-nums'
      : 'text-emerald-700 dark:text-emerald-300 font-medium tabular-nums'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Inventory Ledger</h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading && <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>}
        {!loading && error && <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && txs.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No transactions yet. Transactions appear when you approve a purchase order (stock IN) or create a sales order (stock OUT).
          </div>
        )}
        {!loading && !error && txs.length > 0 && (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Product</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Type</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Qty</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Reference</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-mono text-sm">{t.transactionDate}</td>
                    <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{productDisplay(t)}</td>
                    <td className="px-4 py-3">
                      <span className={'px-2 py-0.5 rounded text-sm ' + typeBadgeClass(t.transactionType)}>{t.transactionType}</span>
                    </td>
                    <td className={'px-4 py-3 text-right tabular-nums ' + qtyClass(t)}>{qtyDisplay(t)}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{t.referenceType} #{String(t.referenceId ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Prev
                </button>
                <span className="py-2">Page {page + 1} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
