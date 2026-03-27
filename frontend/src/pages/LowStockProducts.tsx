import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, purchaseOrdersApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

type LowStockProduct = {
  id?: string
  sku?: string
  name?: string
  categoryName?: string
  supplierId?: string
  supplierName?: string
  currentQuantity?: number
  reorderLevel?: number
  stockStatus?: string
}

export default function LowStockProducts() {
  const { user } = useAuth()
  const canCreatePo = user?.roles?.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))
  const [items, setItems] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poQty, setPoQty] = useState<Record<string, string>>({})
  const [poLoadingById, setPoLoadingById] = useState<Record<string, boolean>>({})
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    productsApi
      .lowStock()
      .then((r) => {
        const data = Array.isArray(r.data) ? (r.data as LowStockProduct[]) : []
        setItems(data)
        const initialQty: Record<string, string> = {}
        for (const p of data) {
          if (!p.id) continue
          initialQty[p.id] = ''
        }
        setPoQty(initialQty)
      })
      .catch((err) => {
        setItems([])
        setError(err.response?.data?.message || err.message || 'Failed to load low-stock products.')
      })
      .finally(() => setLoading(false))
  }, [])

  const createQuickPo = async (product: LowStockProduct) => {
    if (!product.id) return
    if (!product.supplierId) {
      setActionMessage(`Supplier is not set for ${product.sku ?? 'this product'}. Please assign supplier first.`)
      return
    }
    const rawQty = (poQty[product.id] ?? '').trim()
    if (!rawQty || !/^\d+$/.test(rawQty)) {
      setActionMessage('Enter a whole-number quantity (e.g. 200).')
      return
    }
    const qty = parseInt(rawQty, 10)
    if (qty < 1) {
      setActionMessage('Quantity must be at least 1.')
      return
    }
    setActionMessage(null)
    setPoLoadingById((prev) => ({ ...prev, [product.id!]: true }))
    try {
      await purchaseOrdersApi.create({
        supplierId: product.supplierId,
        items: [{ productId: product.id, quantity: qty }],
      })
      setActionMessage(`Purchase order created for ${product.sku ?? product.name ?? 'product'} (qty ${qty}).`)
    } catch (err: any) {
      setActionMessage(
        err?.response?.data?.message || err?.message || `Failed to create purchase order for ${product.sku ?? 'product'}.`
      )
    } finally {
      setPoLoadingById((prev) => ({ ...prev, [product.id!]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Low Stock Products</h1>
      </div>
      {actionMessage && (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          {actionMessage}
        </div>
      )}

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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Supplier</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Current Qty</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Reorder Level</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                {canCreatePo && <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Quick Purchase</th>}
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
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.supplierName ?? '-'}</td>
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
                  {canCreatePo && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label={`Order quantity for ${p.sku ?? 'product'}`}
                          placeholder={(() => {
                            if (!p.id) return 'Qty'
                            const current = p.currentQuantity ?? 0
                            const reorder = p.reorderLevel ?? 0
                            const hint = Math.max(1, reorder - current)
                            return String(hint)
                          })()}
                          value={p.id ? poQty[p.id] ?? '' : ''}
                          onChange={(e) => {
                            if (!p.id) return
                            const digitsOnly = e.target.value.replace(/\D/g, '')
                            setPoQty((prev) => ({ ...prev, [p.id!]: digitsOnly }))
                          }}
                          className="w-24 min-w-[5.5rem] px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tabular-nums"
                        />
                        <button
                          type="button"
                          disabled={!p.id || !p.supplierId || !!poLoadingById[p.id]}
                          onClick={() => createQuickPo(p)}
                          className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm"
                          title={!p.supplierId ? 'Set supplier for this product first' : 'Create purchase order'}
                        >
                          {p.id && poLoadingById[p.id] ? 'Creating…' : 'Create PO'}
                        </button>
                      </div>
                    </td>
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
