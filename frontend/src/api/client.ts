import axios from 'axios'

// For separate deployments, set `VITE_API_BASE_URL` to your backend origin + `/api/v1`.
// Example: `https://smart-inventory-backend.onrender.com/api/v1`
// Note: TS config in this repo may not include Vite's ImportMeta types, so we access via `import.meta as any`.
const buildTimeApiBase = (((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? undefined) as
  | string
  | undefined

// Fallback for Render deployments:
// If the frontend is hosted on *.onrender.com but `VITE_API_BASE_URL` was not set during build,
// use the known backend URL so API calls still work.
const inferredApiBase =
  typeof window !== 'undefined' &&
  window.location.hostname.includes('onrender.com') &&
  window.location.hostname.includes('smart-inventory-frontend')
    ? 'https://smart-inventory-management-system-lv2p.onrender.com/api/v1'
    : undefined

// Prefer the inferred Render backend if we're on *.onrender.com, even if
// VITE_API_BASE_URL was set to a relative path during build.
const API_BASE = (inferredApiBase ?? buildTimeApiBase ?? '/api/v1') as string

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; id: string | number; username: string; email: string; fullName: string; roles: string[] }>(
      '/auth/login',
      { username, password }
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
  adminResetPassword: (userId: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/admin/reset-password', { userId, newPassword }),
}

export type DashboardStatsPayload = {
  totalProducts: number
  lowStockCount: number
  totalRevenue: number
  pendingOrdersCount: number
  activeSuppliersCount: number
  lowStockItems: Array<{ id?: string | number; sku: string; name: string; currentQuantity: number; reorderLevel: number; stockStatus: string }>
}

export type DashboardChartsPayload = {
  /** Units sold per category */
  productsByCategory: Array<{ categoryName: string; count: number }>
  /** Active product (SKU) count per category */
  productCountByCategory?: Array<{ categoryName: string; count: number }>
  stockStatusBreakdown: Array<{ status: string; count: number }>
}

export const dashboardApi = {
  /** Preferred: one HTTP request for the whole dashboard (faster than stats + charts). */
  getOverview: (params?: { from?: string; to?: string }) =>
    api.get<{ stats: DashboardStatsPayload; charts: DashboardChartsPayload }>('/dashboard/overview', { params }),
  getStats: () => api.get<DashboardStatsPayload>('/dashboard/stats'),
  getCharts: () => api.get<DashboardChartsPayload>('/dashboard/charts'),
}

export const productsApi = {
  list: (params?: { search?: string; categoryId?: string | number; warehouseId?: string; page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
    api.get<{ content: unknown[]; totalElements: number; totalPages: number; page?: number; number?: number; size: number }>('/products', { params }),
  get: (id: string | number) => api.get(`/products/${id}`),
  scan: (barcode: string) => api.get(`/products/scan`, { params: { barcode } }),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string | number, data: unknown) => api.put(`/products/${id}`, data),
  lowStock: () => api.get<unknown[]>('/products/low-stock'),
  reorderSuggestions: () => api.get<unknown[]>('/products/reorder-suggestions'),
  bulkImport: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ totalRows: number; imported: number; skipped: number }>('/products/bulk/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  bulkStockUpdate: (items: Array<{ productId: string; quantity: number }>) =>
    api.post<{ updated: number; failed: number }>('/products/bulk/stock-update', { items }),
}

export const categoriesApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<{ content: unknown[] }>('/categories', { params }),
  get: (id: string | number) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/categories', data),
  update: (id: string, data: { name?: string; description?: string }) => api.put(`/categories/${id}`, data),
}

export const warehousesApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<{ content: unknown[] }>('/warehouses', { params }),
  listAll: () => api.get<unknown[]>('/warehouses/all'),
  get: (id: string) => api.get(`/warehouses/${id}`),
  create: (data: unknown) => api.post('/warehouses', data),
  update: (id: string, data: unknown) => api.put(`/warehouses/${id}`, data),
}

export const suppliersApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<{ content: unknown[] }>('/suppliers', { params }),
  get: (id: string | number) => api.get(`/suppliers/${id}`),
  create: (data: unknown) => api.post('/suppliers', data),
  update: (id: string, data: unknown) => api.put(`/suppliers/${id}`, data),
}

export const purchaseOrdersApi = {
  list: (params?: { page?: number; size?: number; search?: string; status?: string; productId?: string }) =>
    api.get<{ content: unknown[]; totalElements: number; totalPages: number }>('/purchase-orders', { params }),
  get: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (data: { supplierId: string; items: Array<{ productId: string; quantity: number; unitPrice?: number }> }) =>
    api.post('/purchase-orders', data),
  approve: (id: string) => api.post(`/purchase-orders/${id}/approve`),
  receive: (id: string) => api.post(`/purchase-orders/${id}/receive`),
  reject: (id: string) => api.post(`/purchase-orders/${id}/reject`),
}

export const salesOrdersApi = {
  list: (params?: { page?: number; size?: number; search?: string; productId?: string }) =>
    api.get<{ content: unknown[]; totalElements?: number; totalPages?: number }>('/sales-orders', { params }),
  create: (data: { items: Array<{ productId: string; quantity: number; unitPrice?: number }>; customerName?: string; customerEmail?: string }) =>
    api.post('/sales-orders', data),
  // Empty JSON body + action-first paths: ensures Content-Type: application/json and reliable routing
  confirm: (id: string) => api.post(`/sales-orders/confirm/${id}`, {}),
  ship: (id: string) => api.post(`/sales-orders/ship/${id}`, {}),
  deliver: (id: string) => api.post(`/sales-orders/deliver/${id}`, {}),
}

export const ledgerApi = {
  list: (params?: { page?: number; size?: number; productId?: string; transactionType?: string }) =>
    api.get<{ content: unknown[]; totalElements?: number; totalPages?: number }>('/ledger', { params }),
  adjust: (data: { productId: string; quantity: number; notes?: string }) =>
    api.post('/ledger/adjust', data),
}

export const usersApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    api.get<{ content: unknown[]; totalElements: number; totalPages: number }>('/users', { params }),
  listAll: () => api.get<unknown[]>('/users/all'),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: { username: string; password: string; email?: string; fullName?: string; enabled?: boolean; roles?: string[] }) =>
    api.post('/users', data),
  update: (id: string, data: { email?: string; fullName?: string; enabled?: boolean; roles?: string[]; password?: string }) =>
    api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

export const settingsApi = {
  list: () => api.get<unknown[]>('/settings'),
  get: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, data: { settingValue: string }) => api.put(`/settings/${key}`, data),
}

export const auditLogsApi = {
  list: (params?: { action?: string; entityType?: string; userId?: string; from?: string; to?: string; page?: number; size?: number }) =>
    api.get<{ content: unknown[]; totalElements?: number; totalPages?: number }>('/audit-logs', { params }),
}

export const reportsApi = {
  get: (params?: { from?: string; to?: string }) =>
    api.get<{
      totalRevenue: number
      orderCount: number
      revenueByDate: Array<{ date: string; revenue: number; orderCount: number }>
      salesByCategory: Array<{ categoryName: string; quantitySold: number; revenue: number }>
    }>('/reports', { params }),
  exportReportsCsv: (params?: { from?: string; to?: string }) =>
    api.get<Blob>('/reports/export/csv', { params, responseType: 'blob' }),
  exportReportsExcel: (params?: { from?: string; to?: string }) =>
    api.get<Blob>('/reports/export/excel', { params, responseType: 'blob' }),
  exportProductsCsv: () => api.get<Blob>('/reports/export/products/csv', { responseType: 'blob' }),
  exportProductsExcel: () => api.get<Blob>('/reports/export/products/excel', { responseType: 'blob' }),
  exportPdf: (params?: { from?: string; to?: string }) =>
    api.get<Blob>('/reports/export/pdf', { params, responseType: 'blob' }),
}
