import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { appConfig, type LanguageCode } from '@/config'
import en from '@/i18n/locales/en.json'
import { readStorage, storageKeys, writeStorage } from '@/lib/storage'

// Labels live in src/i18n/locales/*.json. English ships with the app. Hindi and Telugu load only
// when a user picks them, so nobody downloads languages they do not use. Each file is checked
// against English with `satisfies`, so a missing key still fails the build.
type DeepMessages<T> = { [K in keyof T]: T[K] extends string ? string : DeepMessages<T[K]> }
export type LocaleMessages = DeepMessages<typeof en>

export const LANGUAGES = appConfig.locale.languages
export type { LanguageCode }

async function loadLocale(lng: LanguageCode): Promise<LocaleMessages> {
  switch (lng) {
    case 'hi':
      return (await import('@/i18n/locales/hi.json')).default satisfies LocaleMessages
    case 'te':
      return (await import('@/i18n/locales/te.json')).default satisfies LocaleMessages
    default:
      return en
  }
}

async function ensureLocale(lng: LanguageCode) {
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    i18n.addResourceBundle(lng, 'translation', await loadLocale(lng), true, true)
  }
}

// Indic scripts are large, so each font is fetched only when its language is selected.
const SCRIPT_FONTS: Partial<Record<LanguageCode, () => Promise<unknown>>> = {
  hi: () =>
    Promise.all([
      import('@fontsource/noto-sans-devanagari/400.css'),
      import('@fontsource/noto-sans-devanagari/500.css'),
      import('@fontsource/noto-sans-devanagari/600.css'),
      import('@fontsource/noto-sans-devanagari/700.css'),
    ]),
  te: () =>
    Promise.all([
      import('@fontsource/noto-sans-telugu/400.css'),
      import('@fontsource/noto-sans-telugu/500.css'),
      import('@fontsource/noto-sans-telugu/600.css'),
      import('@fontsource/noto-sans-telugu/700.css'),
    ]),
}
const loadedScripts = new Set<string>()

function loadScriptFont(lng: string) {
  const load = SCRIPT_FONTS[lng as LanguageCode]
  if (!load || loadedScripts.has(lng)) return
  loadedScripts.add(lng)
  void load()
}

const stored = readStorage<string>(storageKeys.language, appConfig.locale.defaultLanguage)
const initial = (LANGUAGES.some((l) => l.code === stored) ? stored : appConfig.locale.defaultLanguage) as LanguageCode

/** Resolves once the first language is loaded. main.tsx waits for it before rendering. */
export const i18nReady = (async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  await ensureLocale(initial)
  await i18n.changeLanguage(initial)
})()

/** Switches language, loading its messages first so no key shows untranslated. */
export async function setLanguage(lng: LanguageCode) {
  await ensureLocale(lng)
  await i18n.changeLanguage(lng)
}

document.documentElement.lang = initial
loadScriptFont(initial)

i18n.on('languageChanged', (lng) => {
  writeStorage(storageKeys.language, lng)
  document.documentElement.lang = lng
  loadScriptFont(lng)
})

export default i18n
