import * as React from 'react'
import { appConfig, themeConfig, type ChartPalette, type ThemeMode } from '@/config'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { readStorage, storageKeys, writeStorage } from '@/lib/storage'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => readStorage(storageKeys.theme, appConfig.theme.default))
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved: 'light' | 'dark' = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode

  React.useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    const color = resolved === 'dark' ? themeConfig.colors.dark.sidebar : appConfig.app.themeColor
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [resolved])

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode: (m) => {
        setModeState(m)
        writeStorage(storageKeys.theme, m)
      },
    }),
    [mode, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

/** Chart colours for the active theme (charts draw in SVG, so they need values, not classes). */
export function useChartPalette(): ChartPalette {
  return themeConfig.chart[useTheme().resolved]
}
