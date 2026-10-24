# Styling

## Tokens

`src/styles/tokens.css` is **generated** from `src/config/theme.json` by `scripts/build-tokens.mjs`. It runs automatically before `npm run dev` and `npm run build` (`predev`, `prebuild`). Do not edit it by hand. To change a colour, edit `theme.json`. To change a fixed scale, edit the `scales` object in the script.

| Group | Tokens |
|---|---|
| Colours (theme.json) | `--background`, `--surface`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--primary`, `--primary-hover`, `--primary-foreground`, `--primary-soft`, `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--navy`, `--success` / `--success-soft`, `--warning` / `--warning-soft`, `--danger` / `--danger-soft`, `--info` / `--info-soft`, `--skeleton`, `--overlay` |
| Spacing | `--space-1` … `--space-12` (1 = 0.25rem) |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full` |
| Type | `--font-sans`, `--font-size-xs` … `--font-size-3xl`, `--font-weight-normal` … `--font-weight-bold` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Z-index | `--z-base`, `--z-sticky`, `--z-overlay`, `--z-modal`, `--z-toast` |
| Motion | `--duration-fast`, `--duration-base`, `--duration-slow`, `--easing-standard`, `--easing-exit` |

## Theming

Light values are the default on `:root`. Dark values apply under `:root.dark`. The theme provider and the boot script in `index.html` set the `dark` class, the boot script before first paint. `tokens.css` is the only place these variables are defined. Editing `theme.json` regenerates it: the Vite dev server watches the file, and `npm run build` regenerates it through `prebuild`.

Components must use the variables, never raw hex values, in new code:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

## Class naming

- Components use CSS modules: `ComponentName.module.css` next to `ComponentName.tsx`.
- Class names inside a module are camelCase and describe the part, not the look: `.header`, `.actions`, `.rowSelected`.
- Variants are modifier classes on the same element: `styles.button` + `styles.primary`.
- Global classes are limited to `src/index.css` (base layer, resets, and the Tailwind theme bridge).
- Feature folders own their styles: `src/features/<name>/styles/<name>.module.css`. A feature may not override shared components from its folder.

## Migration status

The app still uses Tailwind utility classes. They keep working while components are converted one at a time to CSS modules. A component counts as converted when it no longer uses Tailwind utility classes and all its colours come from tokens.

The palette classes that existed in the app (amber, teal) now use semantic tokens (`--warning`, `--sidebar-accent`). `src/config/colors.ts` was unused and has been removed.
