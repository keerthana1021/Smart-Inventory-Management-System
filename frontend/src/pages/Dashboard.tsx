import { useEffect, useState, useCallback } from 'react'
import { Package, AlertTriangle, DollarSign, Clock, Truck, RefreshCw, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { dashboardApi } from '../api/client'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const STOCK_COLORS = { STOCKED: '#22c55e', LOW: '#eab308', CRITICAL: '#ef4444' }

export default function Dashboard() {
  const { resolved } = useTheme()
  const chartTickFill = resolved === 'dark' ? '#cbd5e1' : '#334155'
  const chartGridStroke = resolved === 'dark' ? '#475569' : '#e2e8f0'
  const pieLabelFill = resolved === 'dark' ? '#e2e8f0' : '#0f172a'

  const [stats, setStats] = useState<{
    totalProducts: number
    lowStockCount: number
    totalRevenue: number
    pendingOrdersCount: number
    activeSuppliersCount: number
    lowStockItems: Array<{ id?: string | number; sku: string; name: string; currentQuantity: number; reorderLevel: number; stockStatus: string }>
  } | null>(null)
  const [charts, setCharts] = useState<{
    productsByCategory: Array<{ categoryName: string; count: number }>
    productCountByCategory?: Array<{ categoryName: string; count: number }>
    stockStatusBreakdown: Array<{ status: string; count: number }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback((overrides?: { from?: string; to?: string }) => {
    const f = overrides?.from ?? from
    const t = overrides?.to ?? to
    setLoading(true)
    setError(null)
    const params: { from?: string; to?: string } = {}
    if (f) params.from = f
    if (t) params.to = t
    dashboardApi
      .getOverview(params)
      .then((res) => {
        setStats(res.data.stats)
        setCharts(res.data.charts)
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard. Ensure the backend is running on port 8080.')
        setStats({
          totalProducts: 0,
          lowStockCount: 0,
          totalRevenue: 0,
          pendingOrdersCount: 0,
          activeSuppliersCount: 0,
          lowStockItems: [],
        })
        setCharts({ productsByCategory: [], productCountByCategory: [], stockStatusBreakdown: [] })
      })
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(() => { load() }, [load])

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  /** Slices with count 0 overlap labels in Recharts; only plot non-zero slices. */
  const stockBreakdown = charts?.stockStatusBreakdown ?? []
  const stockPieData = stockBreakdown.filter((s) => s.count > 0)
  const stockZeroSummary = stockBreakdown.filter((s) => s.count === 0)

  const cards = [
    { title: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'bg-indigo-500', link: '/inventory' },
    { title: 'Low Stock', value: stats?.lowStockCount ?? 0, icon: AlertTriangle, color: 'bg-amber-500', link: '/inventory' },
    { title: 'Total Revenue (period)', value: '₹' + Number(stats?.totalRevenue ?? 0).toLocaleString('en-IN'), icon: DollarSign, color: 'bg-emerald-500' },
    { title: 'Pending Orders', value: stats?.pendingOrdersCount ?? 0, icon: Clock, color: 'bg-blue-500', link: '/purchase-orders' },
    { title: 'Suppliers', value: stats?.activeSuppliersCount ?? 0, icon: Truck, color: 'bg-slate-600', link: '/suppliers' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-600 dark:text-slate-300" />
              <div className="flex flex-col">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="date-input-visible px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <span className="md:hidden mt-1 text-[11px] font-semibold text-slate-100 bg-slate-900/55 border border-slate-700/60 rounded px-2 py-0.5 pointer-events-none">
                  From: {from || '-'}
                </span>
              </div>
              <span className="text-slate-600 dark:text-slate-300">to</span>
              <div className="flex flex-col">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="date-input-visible px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <span className="md:hidden mt-1 text-[11px] font-semibold text-slate-100 bg-slate-900/55 border border-slate-700/60 rounded px-2 py-0.5 pointer-events-none">
                  To: {to || '-'}
                </span>
              </div>
          </div>
          <button onClick={() => load()} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Apply
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between">
          <p className="text-amber-900 dark:text-amber-200 text-sm">{error}</p>
          <button onClick={() => load()} className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm font-medium hover:bg-amber-700">Retry</button>
        </div>
      )}
      {(from || to) && (
        <p className="text-xs text-slate-600 dark:text-slate-400">Revenue and Sales by Category are filtered by the selected date range. Leave empty for all-time.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.title} to={c.link || '#'} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{c.title}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{c.value}</p>
                </div>
                <div className={'p-2 rounded-lg ' + c.color + ' text-white'}><Icon size={24} /></div>
              </div>
            </Link>
          )
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sales by category (units sold)</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Totals from CONFIRMED / SHIPPED / DELIVERED sales orders only.</p>
          {charts?.productsByCategory?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.productsByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="categoryName" tick={{ fontSize: 12, fill: chartTickFill }} stroke={chartTickFill} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chartTickFill }} stroke={chartTickFill} />
                <Tooltip contentStyle={resolved === 'dark' ? { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' } : undefined} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Units sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-600 dark:text-slate-400 py-8 text-center">No sales by category yet. Create sales orders to see this chart.</p>}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Stock Status</h2>
          {stockPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stockPieData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={{ stroke: chartTickFill }}
                    label={(props: { status?: string; count?: number; x?: number; y?: number; textAnchor?: string; dominantBaseline?: string }) => (
                      <text
                        x={props.x}
                        y={props.y}
                        textAnchor={props.textAnchor as 'start' | 'middle' | 'end' | undefined}
                        dominantBaseline={props.dominantBaseline as 'central' | undefined}
                        fill={pieLabelFill}
                        fontSize={12}
                      >
                        {`${props.status ?? ''}: ${props.count ?? ''}`}
                      </text>
                    )}
                  >
                    {stockPieData.map((slice, i) => (
                      <Cell key={i} fill={STOCK_COLORS[slice.status as keyof typeof STOCK_COLORS] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={resolved === 'dark' ? { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' } : undefined} />
                  <Legend wrapperStyle={{ color: chartTickFill }} />
                </PieChart>
              </ResponsiveContainer>
              {stockZeroSummary.length > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
                  {stockZeroSummary.map((s) => `${s.status}: ${s.count}`).join(' · ')}
                </p>
              )}
            </>
          ) : <p className="text-slate-600 dark:text-slate-400 py-8 text-center">No stock data yet.</p>}
        </div>
      </div>
      {/* Products by category (under sales chart) + Low stock alerts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col min-h-[320px] text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Products by category</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Count of product SKUs per category (same data as Total Products).</p>
          {(charts?.productCountByCategory?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={280} className="flex-1 min-h-[240px]">
              <BarChart data={charts!.productCountByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="categoryName" tick={{ fontSize: 11, fill: chartTickFill }} stroke={chartTickFill} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chartTickFill }} stroke={chartTickFill} />
                <Tooltip contentStyle={resolved === 'dark' ? { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' } : undefined} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 py-8 text-center flex-1 flex items-center justify-center">No products by category yet.</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col min-h-[320px] text-slate-900 dark:text-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Low Stock Alerts</h2>
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[320px] pr-1">
            {stats?.lowStockItems?.length ? stats.lowStockItems.map((item) => (
              <Link key={item.id} to="/inventory" className="block p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">{item.currentQuantity} / {item.reorderLevel}</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">SKU: {item.sku}</p>
              </Link>
            )) : <p className="text-slate-600 dark:text-slate-400">No low stock items.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
