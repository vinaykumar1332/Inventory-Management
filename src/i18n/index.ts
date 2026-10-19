import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { appConfig, type LanguageCode } from '@/config'
import en from '@/i18n/locales/en.json'
import hi from '@/i18n/locales/hi.json'
import te from '@/i18n/locales/te.json'
import { readStorage, storageKeys, writeStorage } from '@/lib/storage'

// Labels live in src/i18n/locales/*.json. Hindi and Telugu are type-checked
// against English so a missing key fails the build.
type DeepMessages<T> = { [K in keyof T]: T[K] extends string ? string : DeepMessages<T[K]> }
export type LocaleMessages = DeepMessages<typeof en>
const resources: Record<LanguageCode, LocaleMessages> = { en, hi, te }

export const LANGUAGES = appConfig.locale.languages
export type { LanguageCode }

const stored = readStorage<string>(storageKeys.language, appConfig.locale.defaultLanguage)
const initial = (LANGUAGES.some((l) => l.code === stored) ? stored : appConfig.locale.defaultLanguage) as LanguageCode

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, { translation: v }])),
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

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

document.documentElement.lang = initial
loadScriptFont(initial)

i18n.on('languageChanged', (lng) => {
  writeStorage(storageKeys.language, lng)
  document.documentElement.lang = lng
  loadScriptFont(lng)
})

export default i18n
