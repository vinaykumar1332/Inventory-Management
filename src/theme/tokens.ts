import { themeConfig, type ThemeTokens } from '@/config'

// Turns src/config/theme.json into CSS custom properties. Tailwind's theme
// (src/index.css) reads these variables, so editing the JSON re-brands the app.

const block = (selector: string, tokens: ThemeTokens) =>
  `${selector}{${Object.entries(tokens)
    .map(([name, value]) => `--${name}:${value};`)
    .join('')}}`

export function injectThemeTokens() {
  const id = 'theme-tokens'
  const css = [
    block(':root', themeConfig.colors.light),
    block(':root.dark', themeConfig.colors.dark),
    ':root{color-scheme:light}:root.dark{color-scheme:dark}',
  ].join('\n')
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.prepend(el)
  }
  el.textContent = css
}
