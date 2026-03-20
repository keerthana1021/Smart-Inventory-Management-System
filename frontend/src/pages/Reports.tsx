import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { reportsApi } from '../api/client'
import { FileDown, Calendar } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const CATEGORY_COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Reports() {
  const { resolved } = useTheme()
  const chartTickFill = resolved === 'dark' ? '#cbd5e1' : '#334155'
  const chartGridStroke = resolved === 'dark' ? '#475569' : '#e2e8f0'
  const pieLabelFill = resolved === 'dark' ? '#e2e8f0' : '#0f172a'
  const tooltipStyle = resolved === 'dark' ? { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' } : undefined

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<{
    totalRevenue: number
    orderCount: number
    revenueByDate: Array<{ date: string; revenue: number; orderCount: number; byCategory?: Record<string, number> }>
    salesByCategory: Array<{ categoryName: string; quantitySold: number; revenue: number }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'reports-csv' | 'reports-excel' | 'products-csv' | 'products-excel' | null>(null)

  const load = () => {
    setLoading(true)
    const params: { from?: string; to?: string } = {}
    if (from) params.from = from
    if (to) params.to = to
    reportsApi.get(params)
      .then((r) => setData(r.data))
      .catch(() => setData({ totalRevenue: 0, orderCount: 0, revenueByDate: [], salesByCategory: [] }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [from, to])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const reportParams = () => {
    const p: { from?: string; to?: string } = {}
    if (from) p.from = from
    if (to) p.to = to
    return p
  }

  const handleExportReportsCsv = () => {
    setExporting('reports-csv')
    reportsApi.exportReportsCsv(reportParams())
      .then((r) => {
        if (r.status >= 200 && r.status < 300 && r.data instanceof Blob && r.data.size > 0) {
          downloadBlob(r.data, 'reports.csv')
        } else {
          alert('Export failed. Please ensure you are logged in as Admin or Manager.')
        }
      })
      .catch(() => alert('Export failed. Admin/Manager access required.'))
      .finally(() => setExporting(null))
  }

  const handleExportReportsExcel = () => {
    setExporting('reports-excel')
    reportsApi.exportReportsExcel(reportParams())
      .then((r) => {
        if (r.status >= 200 && r.status < 300 && r.data instanceof Blob && r.data.size > 0) {
          downloadBlob(r.data, 'reports.xlsx')
        } else {
          alert('Export failed. Please ensure you are logged in as Admin or Manager.')
        }
      })
      .catch(() => alert('Export failed. Admin/Manager access required.'))
      .finally(() => setExporting(null))
  }

  const handleExportProductsCsv = () => {
    setExporting('products-csv')
    reportsApi.exportProductsCsv()
      .then((r) => {
        if (r.status >= 200 && r.status < 300 && r.data instanceof Blob && r.data.size > 0) {
          downloadBlob(r.data, 'products.csv')
        } else {
          alert('Export failed. Please ensure you are logged in as Admin or Manager.')
        }
      })
      .catch(() => alert('Export failed. Admin/Manager access required.'))
      .finally(() => setExporting(null))
  }

  const handleExportProductsExcel = () => {
    setExporting('products-excel')
    reportsApi.exportProductsExcel()
      .then((r) => {
        if (r.status >= 200 && r.status < 300 && r.data instanceof Blob && r.data.size > 0) {
          downloadBlob(r.data, 'products.xlsx')
        } else {
          alert('Export failed. Please ensure you are logged in as Admin or Manager.')
        }
      })
      .catch(() => alert('Export failed. Admin/Manager access required.'))
      .finally(() => setExporting(null))
  }

  const handleExportPdf = () => {
    const params: { from?: string; to?: string } = {}
    if (from) params.from = from
    if (to) params.to = to
    reportsApi.exportPdf(params)
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'report.pdf'
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => alert('Export failed. Admin/Manager access required.'))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-black dark:text-slate-100">Reports & Analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-600 dark:text-slate-300" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="date-input-visible px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <span className="text-slate-600 dark:text-slate-300">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="date-input-visible px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={load}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium border border-slate-300 dark:border-slate-600"
          >
            Apply
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportReportsCsv}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-70 text-sm font-medium"
            >
              <FileDown size={16} />
              {exporting === 'reports-csv' ? 'Exporting…' : 'Export Reports CSV'}
            </button>
            <button
              onClick={handleExportReportsExcel}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-70 text-sm font-medium"
            >
              <FileDown size={16} />
              {exporting === 'reports-excel' ? 'Exporting…' : 'Export Reports Excel'}
            </button>
            <button
              onClick={handleExportProductsCsv}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-70 text-sm font-medium"
            >
              <FileDown size={16} />
              {exporting === 'products-csv' ? 'Exporting…' : 'Export Products CSV'}
            </button>
            <button
              onClick={handleExportProductsExcel}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-70 text-sm font-medium"
            >
              <FileDown size={16} />
              {exporting === 'products-excel' ? 'Exporting…' : 'Export Products Excel'}
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <FileDown size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue (period)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                ₹{Number(data?.totalRevenue ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Orders (period)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{data?.orderCount ?? 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Revenue by Date</h2>
              {data?.revenueByDate?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.revenueByDate.map((r) => {
                      const cats = data.salesByCategory || []
                      const flat: Record<string, number> = {}
                      cats.forEach((c) => { flat[c.categoryName] = Number((r.byCategory as Record<string, number>)?.[c.categoryName] ?? 0) })
                      return { ...r, ...flat }
                    })}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTickFill }} stroke={chartTickFill} angle={-25} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chartTickFill }} stroke={chartTickFill} />
                    <Tooltip formatter={(v: number) => ['₹' + Number(v || 0).toLocaleString('en-IN'), 'Revenue']} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: chartTickFill }} />
                    {(data.salesByCategory?.length ? data.salesByCategory : []).map((cat, i) => (
                      <Bar
                        key={cat.categoryName}
                        dataKey={cat.categoryName}
                        stackId="a"
                        fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                        name={cat.categoryName}
                        radius={i === 0 ? [4, 4, 0, 0] : 0}
                      />
                    ))}
                    {!data.salesByCategory?.length && (
                      <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 py-8 text-center">No revenue data for this period.</p>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 text-slate-900 dark:text-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sales by Category</h2>
              {data?.salesByCategory?.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.salesByCategory}
                      dataKey="revenue"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine={{ stroke: chartTickFill }}
                      label={(props: { categoryName?: string; revenue?: number; x?: number; y?: number; textAnchor?: string; dominantBaseline?: string }) => (
                        <text
                          x={props.x}
                          y={props.y}
                          textAnchor={props.textAnchor as 'start' | 'middle' | 'end' | undefined}
                          dominantBaseline={props.dominantBaseline as 'central' | undefined}
                          fill={pieLabelFill}
                          fontSize={11}
                        >
                          {`${props.categoryName ?? ''}: ₹${(props.revenue ?? 0).toLocaleString('en-IN')}`}
                        </text>
                      )}
                    >
                      {data.salesByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => ['₹' + v.toLocaleString('en-IN'), 'Revenue']} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: chartTickFill }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-600 dark:text-slate-400 py-8 text-center">No sales by category for this period.</p>
              )}
            </div>
          </div>

          {data?.salesByCategory?.length ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 p-4 border-b border-slate-200 dark:border-slate-700">Sales by Category (table)</h2>
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Quantity Sold</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.salesByCategory.map((s, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">{s.categoryName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.quantitySold}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">₹{Number(s.revenue).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
