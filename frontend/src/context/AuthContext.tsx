import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

/** Backend may return MongoDB string id or numeric id in older builds */
type User = { id: string | number; username: string; email: string; fullName: string; roles: string[] } | null

const AuthContext = createContext<{
  user: User
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) try { setUser(JSON.parse(saved)) } catch (_) {}
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    setToken(data.token)
    setUser({ id: data.id, username: data.username, email: data.email, fullName: data.fullName, roles: data.roles })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username, email: data.email, fullName: data.fullName, roles: data.roles }))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
