import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productsApi, ledgerApi, salesOrdersApi, purchaseOrdersApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

type Product = {
  id?: string
  sku?: string
  name?: string
  description?: string
  categoryName?: string
  supplierName?: string
  warehouseName?: string
  unitPrice?: number
  currentQuantity?: number
  reorderLevel?: number
  stockStatus?: string
  barcode?: string
}

type LedgerEntry = {
  id?: string
  productId?: string
  productSku?: string
  transactionType?: string
  quantity?: number
  quantityAfter?: number
  unitPrice?: number
  referenceType?: string
  referenceId?: string
  transactionDate?: string
  notes?: string
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const canAdjust = user?.roles?.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))
  const [product, setProduct] = useState<Product | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [salesOrders, setSalesOrders] = useState<unknown[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)

  const loadData = () => {
    if (!id) return
    setLoading(true)
    setError(null)
    Promise.all([
      productsApi.get(id),
      ledgerApi.list({ productId: id, page: 0, size: 20 }),
      salesOrdersApi.list({ productId: id, page: 0, size: 10 }),
      purchaseOrdersApi.list({ productId: id, page: 0, size: 10 }),
    ])
      .then(([pRes, lRes, soRes, poRes]) => {
        setProduct(pRes.data as Product)
        const lData = lRes.data as { content?: LedgerEntry[] }
        setLedger(Array.isArray(lData?.content) ? lData.content : [])
        const soData = soRes.data as { content?: unknown[] }
        setSalesOrders(Array.isArray(soData?.content) ? soData.content : [])
        const poData = poRes.data as { content?: unknown[] }
        setPurchaseOrders(Array.isArray(poData?.content) ? poData.content : [])
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load product')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [id])

  const submitAdjust = () => {
    const qty = parseInt(adjustQty, 10)
    if (isNaN(qty) || qty === 0 || !id) {
      setAdjustError('Enter a non-zero quantity (positive to add, negative to subtract)')
      return
    }
    setAdjustError(null)
    setAdjustSubmitting(true)
    ledgerApi.adjust({ productId: id, quantity: qty, notes: adjustNotes || undefined })
      .then(() => {
        setShowAdjust(false)
        setAdjustQty('')
        setAdjustNotes('')
        loadData()  // reload product, ledger, orders
      })
      .catch((err) => setAdjustError(err.response?.data?.message || err.message || 'Adjustment failed'))
      .finally(() => setAdjustSubmitting(false))
  }

  if (loading) return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
  if (error || !product) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error || 'Product not found'}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/inventory" className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">← Back to Inventory</Link>
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">{product.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Product Info</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-600 dark:text-slate-400">SKU</dt><dd className="font-mono text-slate-900 dark:text-slate-100">{product.sku}</dd></div>
            {product.barcode && <div><dt className="text-slate-600 dark:text-slate-400">Barcode</dt><dd className="text-slate-900 dark:text-slate-100">{product.barcode}</dd></div>}
            {product.description && <div><dt className="text-slate-600 dark:text-slate-400">Description</dt><dd className="text-slate-900 dark:text-slate-100">{product.description}</dd></div>}
            <div><dt className="text-slate-600 dark:text-slate-400">Category</dt><dd className="text-slate-900 dark:text-slate-100">{product.categoryName || '-'}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Supplier</dt><dd className="text-slate-900 dark:text-slate-100">{product.supplierName || '-'}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Warehouse</dt><dd className="text-slate-900 dark:text-slate-100">{product.warehouseName || '-'}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Price</dt><dd className="text-slate-900 dark:text-slate-100 tabular-nums">₹{Number(product.unitPrice ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Quantity</dt><dd className="text-slate-900 dark:text-slate-100 font-medium tabular-nums">{product.currentQuantity ?? 0}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Reorder Level</dt><dd className="text-slate-900 dark:text-slate-100 tabular-nums">{product.reorderLevel ?? 0}</dd></div>
            <div><dt className="text-slate-600 dark:text-slate-400">Status</dt>
              <dd><span className={'px-2 py-0.5 rounded text-xs ' + (product.stockStatus === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-200' : product.stockStatus === 'LOW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-900/45 dark:text-green-200')}>{product.stockStatus}</span></dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            <Link to="/inventory" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit product →</Link>
            {canAdjust && (
              <button type="button" onClick={() => setShowAdjust(true)} className="text-amber-600 dark:text-amber-400 hover:underline text-sm">Adjust stock</button>
            )}
          </div>
          {showAdjust && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg space-y-2 border border-slate-200 dark:border-slate-600">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Manual stock adjustment</p>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Quantity (+add / -subtract)</label>
                  <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 5 or -3" className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400">Reason (optional)</label>
                  <input type="text" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="e.g. damage, count correction" className="w-40 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm" />
                </div>
                <button type="button" onClick={submitAdjust} disabled={adjustSubmitting} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50">Apply</button>
                <button type="button" onClick={() => { setShowAdjust(false); setAdjustError(null) }} className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
              </div>
              {adjustError && <p className="text-red-600 dark:text-red-400 text-xs">{adjustError}</p>}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Stock History (Ledger)</h2>
          {ledger.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm">No ledger entries yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-[1] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">Date</th>
                    <th className="text-left px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">Type</th>
                    <th className="text-right px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">Qty</th>
                    <th className="text-right px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">After</th>
                    <th className="text-left px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e, i) => (
                    <tr key={e.id ?? i} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="px-2 py-0.5 text-slate-800 dark:text-slate-200">{e.transactionDate ? new Date(e.transactionDate).toLocaleString() : '-'}</td>
                      <td className="px-2 py-0.5 text-slate-900 dark:text-slate-100">{e.transactionType}</td>
                      <td className={'px-2 py-0.5 text-right tabular-nums font-medium ' + (e.quantity != null && Number(e.quantity) < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300')}>{e.quantity}</td>
                      <td className="px-2 py-0.5 text-right tabular-nums text-slate-900 dark:text-slate-100">{e.quantityAfter}</td>
                      <td className="px-2 py-0.5 truncate max-w-[120px] text-slate-800 dark:text-slate-200">{e.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link to={`/ledger?productId=${id}`} className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline text-sm">View full ledger →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Related Sales Orders</h2>
          {salesOrders.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm">No sales orders containing this product.</p>
          ) : (
            <ul className="space-y-2">
              {salesOrders.map((o: any, i) => (
                <li key={o.id ?? i}>
                  <Link to={`/sales-orders`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono">{o.orderNumber}</Link>
                  <span className="text-slate-700 dark:text-slate-300 ml-2">— {o.status} / ₹{Number(o.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Related Purchase Orders</h2>
          {purchaseOrders.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm">No purchase orders containing this product.</p>
          ) : (
            <ul className="space-y-2">
              {purchaseOrders.map((o: any, i) => (
                <li key={o.id ?? i}>
                  <Link to={`/purchase-orders`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono">{o.orderNumber}</Link>
                  <span className="text-slate-700 dark:text-slate-300 ml-2">— {o.status} / ₹{Number(o.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
