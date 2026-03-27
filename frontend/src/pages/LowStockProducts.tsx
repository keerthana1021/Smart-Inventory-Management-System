import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '../api/client'

type LowStockProduct = {
  id?: string
  sku?: string
  name?: string
  categoryName?: string
  currentQuantity?: number
  reorderLevel?: number
  stockStatus?: string
}

export default function LowStockProducts() {
  const [items, setItems] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    productsApi
      .lowStock()
      .then((r) => {
        const data = Array.isArray(r.data) ? (r.data as LowStockProduct[]) : []
        setItems(data)
      })
      .catch((err) => {
        setItems([])
        setError(err.response?.data?.message || err.message || 'Failed to load low-stock products.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Low Stock Products</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading && <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>}
        {!loading && error && <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-400">
            No low-stock products right now.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">SKU</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Product</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Current Qty</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Reorder Level</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.id ?? `${p.sku}-${i}`} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{p.sku ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                    {p.id ? (
                      <Link to={`/inventory/${p.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {p.name ?? '-'}
                      </Link>
                    ) : (
                      p.name ?? '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.categoryName ?? '-'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">{p.currentQuantity ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{p.reorderLevel ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'px-2 py-0.5 rounded text-sm ' +
                        (p.stockStatus === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200')
                      }
                    >
                      {p.stockStatus ?? 'LOW'}
                    </span>
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
