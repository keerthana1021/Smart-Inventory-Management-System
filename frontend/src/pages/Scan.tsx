import { useState, useRef, useEffect } from 'react'
import { productsApi } from '../api/client'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

type Product = { id: string; sku: string; name: string; currentQuantity?: number; reorderLevel?: number; stockStatus?: string; unitPrice?: number }

export default function Scan() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleScan = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!barcode.trim()) return
    setError(null)
    setProduct(null)
    setLoading(true)
    productsApi.scan(barcode.trim())
      .then((r) => setProduct(r.data as Product))
      .catch((err) => setError(err.response?.data?.message || 'Product not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Barcode / Scan</h1>
      <p className="text-slate-600 dark:text-slate-400">Enter barcode or SKU to look up a product. Use a handheld scanner or type manually.</p>

      <form onSubmit={handleScan} className="flex gap-3 max-w-md">
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan or type barcode / SKU"
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-lg placeholder:text-slate-500 dark:placeholder:text-slate-400"
          autoFocus
        />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          <Package size={20} />
          {loading ? 'Searching...' : 'Look up'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">{error}</div>
      )}

      {product && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 max-w-lg text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Product found</h2>
          <dl className="grid grid-cols-2 gap-3">
            <dt className="text-slate-600 dark:text-slate-400">SKU</dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">{product.sku}</dd>
            <dt className="text-slate-600 dark:text-slate-400">Name</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{product.name}</dd>
            <dt className="text-slate-600 dark:text-slate-400">Stock</dt>
            <dd className="text-slate-900 dark:text-slate-100 tabular-nums">{product.currentQuantity ?? 0} / {product.reorderLevel ?? 0} (reorder)</dd>
            <dt className="text-slate-600 dark:text-slate-400">Status</dt>
            <dd><span className={`px-2 py-0.5 rounded text-sm ${product.stockStatus === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/45 dark:text-red-200' : product.stockStatus === 'LOW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-200'}`}>{product.stockStatus}</span></dd>
          </dl>
          <Link
            to={`/inventory?highlight=${encodeURIComponent(product.id)}`}
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View in Inventory →
          </Link>
        </div>
      )}
    </div>
  )
}
