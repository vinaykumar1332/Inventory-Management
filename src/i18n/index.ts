import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { appConfig, type LanguageCode } from '@/config'
import en from '@/config/i18n/en.json'
import hi from '@/config/i18n/hi.json'
import te from '@/config/i18n/te.json'
import { readStorage, storageKeys, writeStorage } from '@/lib/storage'

// Labels live in src/config/i18n/*.json. Hindi and Telugu are type-checked
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

document.documentElement.lang = initial

i18n.on('languageChanged', (lng) => {
  writeStorage(storageKeys.language, lng)
  document.documentElement.lang = lng
})

export default i18n
