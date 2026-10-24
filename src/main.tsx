import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { listenForInstallPrompt } from '@/features/pwa'
import { i18nReady } from './i18n'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './styles/tokens.css'
import './index.css'
import { App } from '@/app/App'
import * as configFiles from '@/config'

// Dev only: the schema (and zod) is loaded on demand, so production never downloads it.
if (import.meta.env.DEV) {
  void import('@/config/schema').then(({ validateConfig, layoutSchema, navigationSchema, uiSchema }) =>
    validateConfig([
      { name: 'ui.json', schema: uiSchema, data: configFiles.uiConfig },
      { name: 'layout.json', schema: layoutSchema, data: configFiles.layoutConfig },
      { name: 'navigation.json', schema: navigationSchema, data: configFiles.navigationConfig },
    ]),
  )
}

listenForInstallPrompt()

// Render only once the first language's messages are loaded, so no key shows untranslated.
void i18nReady.then(() => {
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
