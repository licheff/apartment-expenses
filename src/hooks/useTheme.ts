import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    root.classList.remove('light', 'dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
  }, [])

  return { theme, setTheme }
}
