import { useState, useEffect, useRef } from 'react'
import { productsApi } from '../api/client'

type Product = { id: string; sku: string; name: string; unitPrice?: number }

export default function ProductPicker({
  value,
  onChange,
  disabled,
  placeholder = 'Search product by SKU or name...',
}: {
  value: string
  onChange: (product: Product | null) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value && !selected) {
      if (results.some((r) => r.id === value)) {
        setSelected(results.find((r) => r.id === value) || null)
      }
    }
    if (!value) {
      setSelected(null)
      setQuery('')
    }
  }, [value, results, selected])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      productsApi.list({ search: query.trim(), page: 0, size: 15 })
        .then((r) => {
          const d = r.data as { content?: Product[] }
          setResults(Array.isArray(d?.content) ? d.content : [])
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (p: Product) => {
    setSelected(p)
    setQuery(`${p.sku} – ${p.name}`)
    setOpen(false)
    onChange(p)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onChange(null)
    setOpen(false)
  }

  const displayValue = selected ? `${selected.sku} – ${selected.name}` : query

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[200px]">
      <div className="flex gap-1">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            if (selected) {
              setSelected(null)
              onChange(null)
            }
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800"
        />
        {selected && (
          <button type="button" onClick={handleClear} className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-sm">✕</button>
        )}
      </div>
      {open && (query || !selected) && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto text-slate-900 dark:text-slate-100">
          {loading ? (
            <div className="p-3 text-slate-600 dark:text-slate-400 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-slate-600 dark:text-slate-400 text-sm">{query ? 'No products found' : 'Type to search'}</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-sm text-slate-900 dark:text-slate-100"
              >
                <span className="font-mono text-slate-700 dark:text-slate-300">{p.sku}</span>
                <span className="ml-2">{p.name}</span>
                {p.unitPrice != null && <span className="ml-2 text-slate-600 dark:text-slate-400 tabular-nums">₹{Number(p.unitPrice).toLocaleString('en-IN')}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
