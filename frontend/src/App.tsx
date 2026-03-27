import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import ProductDetail from './pages/ProductDetail'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import SalesOrders from './pages/SalesOrders'
import Ledger from './pages/Ledger'
import AuditLogs from './pages/AuditLogs'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Users from './pages/Users'
import Reports from './pages/Reports'
import ReorderSuggestions from './pages/ReorderSuggestions'
import Scan from './pages/Scan'
import Warehouses from './pages/Warehouses'
import LowStockProducts from './pages/LowStockProducts'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="low-stock-products" element={<LowStockProducts />} />
        <Route path="inventory/:id" element={<ProductDetail />} />
        <Route path="scan" element={<Scan />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
        <Route path="sales-orders" element={<SalesOrders />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reorder-suggestions" element={<ReorderSuggestions />} />
        <Route path="users" element={<Users />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
