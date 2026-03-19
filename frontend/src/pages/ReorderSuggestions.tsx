import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, purchaseOrdersApi, suppliersApi } from '../api/client'

type Suggestion = {
  productId?: string
  sku?: string
  name?: string
  currentQuantity?: number
  reorderLevel?: number
  suggestedOrderQty?: number
  unitPrice?: number
  categoryName?: string
  supplierName?: string
}

export default function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    productsApi.reorderSuggestions()
      .then((r) => setSuggestions(Array.isArray(r.data) ? (r.data as Suggestion[]) : []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
    suppliersApi.list({ size: 200 }).then((r) => {
      const d = r.data as { content?: { id: string; name: string }[] }
      setSuppliers(Array.isArray(d?.content) ? d.content : [])
    }).catch(() => {})
  }, [])

  const createPO = (productId: string, qty: number, supplierId?: string) => {
    if (!supplierId) {
      alert('Select a supplier first')
      return
    }
    purchaseOrdersApi.create({
      supplierId,
      items: [{ productId, quantity: qty }],
    })
      .then(() => alert('Purchase order created'))
      .catch((e) => alert(e.response?.data?.message || 'Failed'))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Reorder Suggestions</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm">Products below reorder level. Create purchase orders to restock.</p>
      {loading ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
      ) : suggestions.length === 0 ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">No reorder suggestions. All products are well stocked.</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">SKU</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Name</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Current</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Reorder</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Suggest Qty</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Supplier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, i) => (
                  <tr key={s.productId ?? i} className="border-b dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono text-slate-800 dark:text-white">{s.sku}</td>
                    <td className="px-4 py-3">
                      <Link to={`/inventory/${s.productId}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{s.currentQuantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">{s.reorderLevel}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-slate-100">{s.suggestedOrderQty}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100">₹{Number(s.unitPrice ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.supplierName ?? '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        onChange={(e) => { const v = e.target.value; if (v) { createPO(s.productId!, s.suggestedOrderQty ?? 0, v); e.target.value = ''; } }}
                        className="text-sm px-2 py-1.5 rounded border dark:bg-slate-700 dark:border-slate-600 dark:text-white min-h-[36px]"
                      >
                        <option value="">Create PO...</option>
                        {suppliers.map((sup) => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
