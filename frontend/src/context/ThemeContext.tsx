import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; resolved: 'light' | 'dark' } | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system')
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => {
    if (theme === 'dark') return 'dark'
    if (theme === 'light') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setResolved(isDark ? 'dark' : 'light')
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
  }, [theme])

  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => { if (theme === 'system') setResolved(m.matches ? 'dark' : 'light') }
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const c = useContext(ThemeContext)
  if (!c) throw new Error('useTheme must be used within ThemeProvider')
  return c
}
