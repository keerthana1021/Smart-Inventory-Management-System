import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useEffect, useState } from 'react'
import { authApi, api } from '../api/client'
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  FolderTree,
  Truck,
  Warehouse,
  ShoppingCart,
  FileText,
  BarChart3,
  Users,
  Bell,
  Settings,
  ScrollText,
  LogOut,
  Key,
  Download,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'

const ROLE_ORDER = ['STAFF', 'MANAGER', 'ADMIN'] as const
function hasRole(userRoles: string[] | undefined, minRole: string): boolean {
  if (!userRoles?.length) return false
  const minIdx = ROLE_ORDER.indexOf(minRole as (typeof ROLE_ORDER)[number])
  if (minIdx < 0) return true
  return userRoles.some((r) => ROLE_ORDER.indexOf(r as (typeof ROLE_ORDER)[number]) >= minIdx)
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const navItems: Array<{ to: string; label: string; icon: typeof LayoutDashboard; minRole?: string }> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/scan', label: 'Scan', icon: ScanBarcode },
  { to: '/categories', label: 'Categories', icon: FolderTree, minRole: 'MANAGER' },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, minRole: 'MANAGER' },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse, minRole: 'MANAGER' },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { to: '/sales-orders', label: 'Sales Orders', icon: FileText },
  { to: '/ledger', label: 'Ledger', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/reorder-suggestions', label: 'Reorder', icon: Package, minRole: 'MANAGER' },
  { to: '/users', label: 'Users', icon: Users, minRole: 'ADMIN' },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings, minRole: 'ADMIN' },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, minRole: 'ADMIN' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { setTheme, resolved } = useTheme()
  const roles = user?.roles ?? []
  const visibleNavItems = navItems.filter((item) => !item.minRole || hasRole(roles, item.minRole))
  const navigate = useNavigate()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotifications(0)
      return
    }
    let timer: number | undefined
    const load = () => {
      api
        .get('/notifications/unread-count')
        .then((r) => setUnreadNotifications(r.data?.count ?? 0))
        .catch(() => {})
    }
    load()
    timer = window.setInterval(load, 20000)
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [user?.id])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    authApi.changePassword(currentPassword, newPassword)
      .then(() => {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setTimeout(() => { setShowPasswordModal(false); setPasswordSuccess(false) }, 1500)
      })
      .catch((err) => setPasswordError(err.response?.data?.message || 'Failed to change password.'))
      .finally(() => setSubmitting(false))
  }

  const toggleTheme = () => setTheme(resolved === 'dark' ? 'light' : 'dark')
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || ((window.navigator as Navigator & { standalone?: boolean }).standalone === true)
    setIsInstalled(standalone)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="font-semibold text-black dark:text-white text-lg">Smart Inventory</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 min-h-0 touch-pan-y overscroll-contain mobile-menu-nav pr-1">
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
              }`
            }
          >
            {to === '/notifications' && unreadNotifications > 0 ? (
              <span className="relative inline-flex items-center">
                <Icon size={20} />
                <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center border-2 border-slate-50 dark:border-slate-900">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              </span>
            ) : (
              <Icon size={20} />
            )}
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:flex flex-none p-2 pb-[calc(12px+env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button
          onClick={() => { setShowPasswordModal(true); setMobileMenuOpen(false) }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <Key size={20} />
          Change password
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <LogOut size={20} />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button onClick={() => setMobileMenuOpen((o) => !o)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="font-semibold text-slate-800 dark:text-white">Smart Inventory</h1>
        <div className="flex items-center gap-1">
          {!isInstalled && deferredPrompt && (
            <button onClick={handleInstallApp} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200" aria-label="Install app" title="Install app">
              <Download size={20} />
            </button>
          )}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Toggle theme">
            {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar - hidden on mobile unless open */}
      <aside
        className={`${mobileMenuOpen ? 'fixed left-0 top-0 bottom-0 z-40 overflow-hidden' : 'hidden'} md:flex md:relative w-64 h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 flex-col shrink-0`}
      >
        <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <span className="font-semibold text-black dark:text-white">Menu</span>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X size={20} /></button>
        </div>
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop: theme toggle in top bar */}
        <div className="hidden md:flex justify-end p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {!isInstalled && deferredPrompt && (
            <button onClick={handleInstallApp} className="mr-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-600">
              <Download size={16} />
              Install App
            </button>
          )}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" aria-label="Toggle theme">
            {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <main className="app-main-bg flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          <Outlet context={{ openChangePassword: () => setShowPasswordModal(true) }} />
        </main>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !submitting && setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Current password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">New password (min 6 chars)</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
              </div>
              {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}
              {passwordSuccess && <p className="text-emerald-600 text-sm">Password changed successfully.</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Change</button>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
