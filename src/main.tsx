import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { injectThemeTokens } from './theme/tokens'
import { listenForInstallPrompt } from './pwa/pwa'
import './i18n'
import './index.css'
import { App } from './app/App'

// Colours from src/config/theme.json → CSS variables, before first render
injectThemeTokens()
listenForInstallPrompt()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
