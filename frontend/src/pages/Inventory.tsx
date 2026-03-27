import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { productsApi, warehousesApi, categoriesApi, suppliersApi } from '../api/client'

type InventoryProduct = {
  id?: string | number
  sku?: string
  name?: string
  categoryName?: string
  currentQuantity?: number
  stockStatus?: string
  unitPrice?: number
}

type ProductFormData = {
  sku: string
  name: string
  description: string
  categoryId: string
  supplierId: string
  warehouseId: string
  unitPrice: string
  currentQuantity: string
  reorderLevel: string
  barcode: string
}

const emptyForm: ProductFormData = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  supplierId: '',
  warehouseId: '',
  unitPrice: '',
  currentQuantity: '0',
  reorderLevel: '5',
  barcode: '',
}

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const { user } = useAuth()
  const canEdit = user?.roles?.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [size, setSize] = useState(20)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null)
  const [bulkStockRows, setBulkStockRows] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  useEffect(() => {
    warehousesApi.listAll().then((r) => setWarehouses(Array.isArray(r.data) ? (r.data as { id: string; name: string }[]) : [])).catch(() => {})
    categoriesApi.list({ page: 0, size: 500 }).then((r) => {
      const data = r.data as { content?: { id: string; name: string }[] }
      setCategories(Array.isArray(data?.content) ? data.content : [])
    }).catch(() => {})
    suppliersApi.list({ page: 0, size: 500 }).then((r) => {
      const data = r.data as { content?: { id: string; name: string }[] }
      setSuppliers(Array.isArray(data?.content) ? data.content : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const loadProducts = () => {
    setError(null)
    productsApi.list({
      page,
      size,
      search: debouncedSearch || undefined,
      warehouseId: warehouseId || undefined,
      categoryId: categoryId || undefined,
    })
      .then((r) => {
        const data = r.data as { content?: InventoryProduct[]; totalPages?: number }
        setProducts(data?.content ?? [])
        setTotalPages(data?.totalPages ?? 0)
      })
      .catch((err) => {
        setProducts([])
        setError(err.response?.data?.message || err.message || 'Failed to load inventory. Is the backend running on port 8080?')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [page, size, debouncedSearch, warehouseId, categoryId])

  /** Deep link from Scan: /inventory?highlight=<productId> — narrow list and scroll to row */
  useEffect(() => {
    if (!highlightId) return
    let cancelled = false
    setWarehouseId('')
    setCategoryId('')
    productsApi
      .get(highlightId)
      .then((r) => {
        if (cancelled) return
        const p = r.data as { sku?: string }
        if (p.sku) {
          setSearch(p.sku.trim())
          setPage(0)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [highlightId])

  useEffect(() => {
    if (!highlightId || loading || error) return
    const match = products.find((p) => p.id != null && String(p.id) === highlightId)
    if (!match) return
    const scroll = () => rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const raf = window.requestAnimationFrame(() => window.requestAnimationFrame(scroll))
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('highlight')
          return next
        },
        { replace: true }
      )
    }, 4500)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [highlightId, loading, error, products, setSearchParams])

  const openAdd = () => {
    setFormData(emptyForm)
    setFormError(null)
    setEditingId(null)
    setShowAdd(true)
  }

  const openEdit = (id: string) => {
    setFormError(null)
    productsApi.get(id).then((r) => {
      const p = r.data as Record<string, unknown>
      setFormData({
        sku: String(p.sku ?? ''),
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        categoryId: String(p.categoryId ?? ''),
        supplierId: String(p.supplierId ?? ''),
        warehouseId: String(p.warehouseId ?? ''),
        unitPrice: p.unitPrice != null ? String(p.unitPrice) : '',
        currentQuantity: p.currentQuantity != null ? String(p.currentQuantity) : '0',
        reorderLevel: p.reorderLevel != null ? String(p.reorderLevel) : '5',
        barcode: String(p.barcode ?? ''),
      })
      setEditingId(id)
      setShowAdd(true)
    }).catch(() => setFormError('Failed to load product'))
  }

  const closeModal = () => {
    setShowAdd(false)
    setEditingId(null)
    setFormError(null)
  }

  const updateForm = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const submitForm = () => {
    const sku = formData.sku.trim()
    const name = formData.name.trim()
    const categoryId = formData.categoryId
    const unitPrice = parseFloat(formData.unitPrice)
    const currentQuantity = parseInt(formData.currentQuantity, 10)
    const reorderLevel = parseInt(formData.reorderLevel, 10)

    if (!sku) {
      setFormError('SKU is required')
      return
    }
    if (!name) {
      setFormError('Name is required')
      return
    }
    if (!categoryId) {
      setFormError('Category is required')
      return
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      setFormError('Price must be a non-negative number')
      return
    }
    if (isNaN(currentQuantity) || currentQuantity < 0) {
      setFormError('Quantity must be a non-negative integer')
      return
    }
    if (isNaN(reorderLevel) || reorderLevel < 0) {
      setFormError('Reorder level must be a non-negative integer')
      return
    }

    setFormError(null)
    setFormSubmitting(true)

    const payload = {
      sku,
      name,
      description: formData.description.trim() || undefined,
      categoryId,
      supplierId: formData.supplierId || undefined,
      warehouseId: formData.warehouseId || undefined,
      unitPrice,
      currentQuantity,
      reorderLevel,
      barcode: formData.barcode.trim() || undefined,
    }

    if (editingId) {
      productsApi.update(editingId, payload)
        .then(() => {
          closeModal()
          loadProducts()
        })
        .catch((err) => setFormError(err.response?.data?.message || err.message || 'Update failed'))
        .finally(() => setFormSubmitting(false))
    } else {
      productsApi.create(payload)
        .then(() => {
          closeModal()
          loadProducts()
        })
        .catch((err) => setFormError(err.response?.data?.message || err.message || 'Create failed'))
        .finally(() => setFormSubmitting(false))
    }
  }

  const list = products

  const handleBulkImport = () => {
    if (!bulkCsvFile) { setBulkResult('Select a CSV file'); return }
    setBulkLoading(true)
    setBulkResult(null)
    productsApi.bulkImport(bulkCsvFile)
      .then((r) => {
        const d = r.data as { imported?: number; skipped?: number; totalRows?: number }
        setBulkResult(`Imported: ${d.imported ?? 0}, Skipped: ${d.skipped ?? 0}`)
        setBulkCsvFile(null)
        loadProducts()
      })
      .catch((e) => setBulkResult(e.response?.data?.message || 'Import failed'))
      .finally(() => setBulkLoading(false))
  }

  const handleBulkStockUpdate = () => {
    const lines = bulkStockRows.trim().split('\n').filter(Boolean)
    const items = lines.map((line) => {
      const [productId, qtyStr] = line.split(/[,\t]/).map((s) => s.trim())
      return { productId, quantity: parseInt(qtyStr || '0', 10) }
    }).filter((i) => i.productId && !isNaN(i.quantity))
    if (items.length === 0) { setBulkResult('Enter productId,quantity per line'); return }
    setBulkLoading(true)
    setBulkResult(null)
    productsApi.bulkStockUpdate(items)
      .then((r) => {
        const d = r.data as { updated?: number; failed?: number }
        setBulkResult(`Updated: ${d.updated ?? 0}, Failed: ${d.failed ?? 0}`)
        setBulkStockRows('')
        loadProducts()
      })
      .catch((e) => setBulkResult(e.response?.data?.message || 'Update failed'))
      .finally(() => setBulkLoading(false))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Inventory</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Add Product
              </button>
              <button onClick={() => setShowBulk((v) => !v)} className="px-4 py-2 rounded-lg border dark:border-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                Bulk actions
              </button>
            </>
          )}
        </div>
      </div>
      {canEdit && showBulk && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 space-y-4">
          <h3 className="font-medium text-slate-800 dark:text-white">Bulk operations</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">CSV import (columns: sku,name,description,categoryId,supplierId,warehouseId,unitPrice,currentQuantity,reorderLevel,barcode)</p>
              <div className="flex gap-2">
                <input type="file" accept=".csv" onChange={(e) => setBulkCsvFile(e.target.files?.[0] ?? null)} className="text-sm" />
                <button onClick={handleBulkImport} disabled={bulkLoading || !bulkCsvFile} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm disabled:opacity-50">Import</button>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Bulk stock update (productId,quantity per line, quantity is delta)</p>
              <textarea value={bulkStockRows} onChange={(e) => setBulkStockRows(e.target.value)} placeholder="productId1,5&#10;productId2,-3" rows={3} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm font-mono" />
              <button onClick={handleBulkStockUpdate} disabled={bulkLoading} className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm disabled:opacity-50">Apply</button>
            </div>
          </div>
          {bulkResult && <p className="text-sm text-slate-600 dark:text-slate-400">{bulkResult}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <input type="search" placeholder="Search SKU or name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="max-w-md px-4 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600" />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(0) }} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 min-w-[180px]">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(0) }} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 min-w-[180px]">
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={size} onChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0) }} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 min-w-[140px]">
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
        {loading ? <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div> : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700"><tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">SKU</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Qty</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Price</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr></thead>
              <tbody>
                {list.map((p, i) => {
                  const idStr = p.id != null ? String(p.id) : ''
                  const isHighlighted = highlightId != null && idStr !== '' && highlightId === idStr
                  return (
                  <tr
                    key={String(p.id ?? i)}
                    ref={(el) => {
                      if (idStr) rowRefs.current[idStr] = el
                    }}
                    id={idStr ? `inventory-row-${idStr}` : undefined}
                    className={
                      'border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-300 ' +
                      (isHighlighted
                        ? 'bg-indigo-100/90 dark:bg-indigo-950/50 ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400'
                        : '')
                    }
                  >
                    <td className="px-4 py-3 font-mono text-slate-900 dark:text-slate-100">{p.sku}</td>
                    <td className="px-4 py-3">
                      <Link to={`/inventory/${p.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{p.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{p.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">{p.currentQuantity}</td>
                    <td className="px-4 py-3 text-right"><span className={'px-2 py-0.5 rounded text-xs ' + (p.stockStatus === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' : p.stockStatus === 'LOW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200')}>{p.stockStatus}</span></td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">₹{Number(p.unitPrice ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && p.id && <button onClick={() => openEdit(String(p.id))} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">Edit</button>}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
            {list.length === 0 && !search && (
              <div className="p-8 text-center text-slate-600 dark:text-slate-400">No products yet. Add one or seed data via POST /api/v1/seed or POST /api/v1/seed/csv (with admin token).</div>
            )}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700">Prev</button>
                <span className="py-2">Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-black dark:text-slate-100">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
                <input value={formData.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="e.g. PROD-001" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600" readOnly={!!editingId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                <input value={formData.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Product name" className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Optional description" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-black dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select value={formData.categoryId} onChange={(e) => updateForm('categoryId', e.target.value)} className="w-full px-3 py-2 rounded-lg border">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <select value={formData.supplierId} onChange={(e) => updateForm('supplierId', e.target.value)} className="w-full px-3 py-2 rounded-lg border">
                  <option value="">None</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                <select value={formData.warehouseId} onChange={(e) => updateForm('warehouseId', e.target.value)} className="w-full px-3 py-2 rounded-lg border">
                  <option value="">None</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={formData.unitPrice} onChange={(e) => updateForm('unitPrice', e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input type="number" min="0" value={formData.currentQuantity} onChange={(e) => updateForm('currentQuantity', e.target.value)} className="w-full px-3 py-2 rounded-lg border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={formData.reorderLevel} onChange={(e) => updateForm('reorderLevel', e.target.value)} className="w-full px-3 py-2 rounded-lg border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                  <input value={formData.barcode} onChange={(e) => updateForm('barcode', e.target.value)} placeholder="Optional barcode" className="w-full px-3 py-2 rounded-lg border" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border hover:bg-slate-50">Cancel</button>
              <button onClick={submitForm} disabled={formSubmitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {formSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
