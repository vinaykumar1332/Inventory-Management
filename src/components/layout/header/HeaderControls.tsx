import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Languages, Monitor, Moon, Sun } from 'lucide-react'
import { appConfig, type LanguageCode, type ThemeMode } from '@/config'
import { LANGUAGES } from '@/i18n'
import { useAlerts } from '@/hooks/queries'
import { useTheme } from '@/theme/ThemeProvider'
import { cn } from '@/lib/utils'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui'

export function LanguageSelect({ variant = 'default' }: { variant?: 'default' | 'onDark' }) {
  const { t, i18n } = useTranslation()
  if (!appConfig.features.languageSwitch) return null
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('h-11 gap-1.5 px-2.5 md:h-9', variant === 'onDark' && 'text-white hover:bg-white/10')}
          aria-label={`${t('header.language')}: ${current.label}`}
        >
          <Languages aria-hidden />
          <span className="text-sm font-medium">
            <span className="sm:hidden">{current.short}</span>
            <span className="hidden sm:inline">{current.label}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current.code} onValueChange={(v) => void i18n.changeLanguage(v as LanguageCode)}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const

/** Light / dark / system theme switch (modes from app.json) */
export function ThemeToggle({ withLabel }: { withLabel?: boolean }) {
  const { t } = useTranslation()
  const { mode, resolved, setMode } = useTheme()
  if (!appConfig.features.themeToggle) return null
  const Icon = mode === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={withLabel ? 'secondary' : 'ghost'} size={withLabel ? 'md' : 'icon'} aria-label={`${t('theme.label')}: ${t(`theme.${mode}`)}`}>
          <Icon className="!size-[18px]" aria-hidden />
          {withLabel && `${t('theme.label')}: ${t(`theme.${mode}`)}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
          {appConfig.theme.modes.map((m) => {
            const MIcon = THEME_ICONS[m]
            return (
              <DropdownMenuRadioItem key={m} value={m}>
                <MIcon className="size-4 text-muted-foreground" aria-hidden />
                {t(`theme.${m}`)}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AlertsBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = useAlerts()
  const unread = data?.filter((a) => !a.read && !a.resolved).length ?? 0
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => navigate('/alerts')}
      aria-label={unread ? t('header.unreadAlerts', { count: unread }) : t('header.notifications')}
    >
      <Bell className="!size-5" />
      {unread > 0 && (
        <span className="tabular absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-[18px] text-white md:right-0.5 md:top-0.5">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Button>
  )
}
