import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { ChevronDown, LogOut, Moon, Sun, Zap } from 'lucide-react'
import { appConfig } from '@/config'
import { ROUTES } from '@/app/routes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/theme/ThemeProvider'

export function UserProfile() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { mode: theme, setMode: setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  if (!user) return null

  return (
    <div className="relative">
      {/* Profile trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200',
          'hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring',
          open && 'bg-muted/70',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="truncate text-xs">{user.name}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
          <ChevronDown className="size-4" aria-hidden />
        </m.span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <m.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-surface p-2 shadow-lg"
          role="menu"
        >
          {/* User info */}
          <div className="border-b px-3 py-2 text-xs">
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {t(`roles.${user.role}`)}
            </p>
          </div>

          {/* Language selector */}
          <div className="px-2 py-1.5">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{t('common.language')}</p>
            <div className="flex gap-1">
              {['en', 'hi', 'te'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    i18n.changeLanguage(lang)
                    localStorage.setItem('app:language', lang)
                  }}
                  className={cn(
                    'flex-1 rounded px-2 py-1 text-xs font-medium transition-all duration-200',
                    i18n.language === lang
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                  role="menuitem"
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Theme selector */}
          <div className="border-t px-2 py-1.5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t('common.theme')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', icon: Sun, label: t('common.light') },
                { value: 'dark', icon: Moon, label: t('common.dark') },
                { value: 'system', icon: Zap, label: t('common.system') },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value as any)
                    localStorage.setItem('app:theme', value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded px-2 py-2 text-xs transition-all duration-200',
                    theme === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                  title={label}
                  role="menuitem"
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Version */}
          <div className="border-t px-3 py-2 text-center text-[10px] text-muted-foreground/60">
            v{(appConfig as any).version || '1.0.0'}
          </div>

          {/* Sign out */}
          <button
            onClick={() => {
              setOpen(false)
              window.location.href = ROUTES.logout
            }}
            className="mt-1 w-full flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors duration-200"
            role="menuitem"
          >
            <LogOut className="size-4" aria-hidden />
            {t('auth.signOut')}
          </button>
        </m.div>
      )}

      {/* Close menu when clicking outside */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
    </div>
  )
}
