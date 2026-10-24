# Architecture

Written for: engineers joining the codebase who need to know where code lives and how the layers call each other.

This is a client-only demo. There is no server. Everything the app reads and writes goes through `src/api/`, which runs against an in-memory copy of the mock JSON in `src/data/`. Authorization in the UI and in the mock API is for demonstration only. A real backend must enforce the same rules.

## Layers

```text
pages/            Route screens. Compose shared components and feature components.
features/         Domain folders (sites, bills, approvals, access, pwa, ...). Own their components.
components/      ui/ (primitives), common/ (shared components, incl. page frames), shell/ (app shell, not reusable)
hooks/            queries.ts (TanStack Query hooks), useGuardedAction, useMediaQuery
api/              mockApi.ts (the API surface), db.ts (in-memory DB), selectors.ts (derived views),
                  session.ts, audit.ts, errors.ts
data/             Mock JSON and the loader that shifts dates relative to a reference date
config/           JSON configuration and typed accessors (appConfig, uiConfig, layoutConfig, ...)
lib/              Cookie storage, platform checks, small utilities (no domain logic)
i18n/             i18next setup and locales (en, hi, te)
theme/            Theme provider (light, dark, system) and token injection
styles/           Generated tokens.css (do not edit) and shared CSS
app/              Router, route table, route helpers (routes.ts)
```

Dependencies point downward. A page may import a feature, a feature may import `components/` and `hooks/`, and `api/` must not import from `pages/` or `components/`.

## Data flow

1. A page calls a hook from `hooks/queries.ts`, for example `useSites()`.
2. The hook wraps a function in `api/mockApi.ts` with TanStack Query. Query keys come from `queryKeys`.
3. `mockApi.ts` checks access with `authorize()` or `authorizeAction()`, reads or changes the in-memory DB from `api/db.ts`, and returns a result.
4. Screens that change data use `useApiMutation`. It dedupes identical in-flight calls and shows the success or pending toast.
5. Derived views (dashboard numbers, site summaries, labour rosters) are built in `api/selectors.ts`, not in components.

Pages never import `mockApi.ts` directly for reads. Mutations may call the API directly from a feature hook, but they still go through `useApiMutation` so the duplicate-request control applies.

## Access control

- The permission table is `src/config/roles.json`. It has three roles (`super_admin`, `admin`, `site_manager`) and a map of governed actions. Each action resolves to `direct`, `needs_approval` or `forbidden` for each role.
- `src/features/access/permissions.ts` is the only place that reads that table. It exports `describeAccess`, `can`, `requiredApproverFor` and `canApprove`. The UI (`<Can>`, the route guard, `useAuth().can`) and the mock API both use it, so they cannot disagree.
- `<Can>` is in `src/features/access/components/Can.tsx`. The route guard is in `src/app/router.tsx`. See [routing.md](routing.md).

## Approvals

When a role's action resolves to `needs_approval`, `features/approvals/engine.ts` stores a pending request instead of applying the change:

- `submitChange` applies the change directly, or returns `{ status: 'pending', approvalId }`.
- `approveChange` checks a fingerprint of the target when the request was made. If the target changed in the meantime, the request is marked `conflict`.
- `reviewable` blocks self-approval and requires the reviewer to satisfy `canApprove`.

Each action has an applier function in `mockApi.ts` (for example `applyIssue`, `applySiteUpdate`, `applyAttendance`). Approval and direct submission both run the same applier, so the outcome is the same either way.

## Configuration

Values that might change without a code change live in `src/config/*.json`:

| File | Holds |
|---|---|
| `app.json` | App name, locale, feature flags, demo settings (`demo.apiDelayMs`, quick-login emails) |
| `ui.json` | Breakpoints, side panel defaults, table page size and mobile cards, toast duration |
| `layout.json` | Content width, sidebar defaults, aside width, dashboard rows |
| `navigation.json` | Route table, aliases, sidebar items and sections |
| `roles.json` | Roles, governed actions, permission aliases, static permissions, matrix rows |
| `dashboard.json`, `catalog.json`, `business.json`, `theme.json` | Dashboard widgets, enums and labels, business limits, colour theme |

`src/config/index.ts` exports typed accessors. `src/config/schema.ts` holds zod schemas for `ui`, `layout` and `navigation`. `validateConfig()` runs in development only, from `main.tsx`, so a bad edit fails loudly while you work and costs nothing in production.

## Styling

Three layers, used in this order:

1. **Tokens.** `src/config/theme.json` plus fixed scales are turned into `src/styles/tokens.css` by `scripts/build-tokens.mjs`. The script runs as `prebuild` and `predev`. Edit the JSON, not the generated file. Dark mode is set on `:root.dark`, which the theme provider and the boot script toggle.
2. **Tailwind v4 utilities** for most existing screens and the ui primitives. Colours and radii come from the tokens.
3. **CSS modules** for new shared components (`ResponsiveTable.module.css`, `PageLayout.module.css`, `DashboardGrid.module.css`). Use tokens, not literal colours. Progress is tracked in [styling.md](styling.md).

## Network and PWA

- `features/pwa/` has the install prompt, the online, slow and offline state (`useNetworkState`), the update prompt, and the app badge.
- `src/sw.ts` is the service worker, built by `vite-plugin-pwa` in `injectManifest` mode. It precaches the app shell, serves navigations from `index.html`, uses network-first for API-like requests, and handles `SKIP_WAITING`.
- Sensitive responses and invoice file contents are not cached. See `docs/IMPLEMENTATION.md` §10 and §7.

## Storage

- `src/lib/storage.ts` keeps the few per-user preferences (language, theme, sidebar state, view choices) and the session in cookies. There is no `localStorage` for app state.
- The mock DB lives in memory. A reload resets it, and `resetDb()` restores the seed data.

## Testing

- Vitest with jsdom. Config is in `vitest.config.ts`, and setup is in `src/test/setup.ts`.
- Test files sit next to the code: `*.test.ts` or `*.test.tsx` under `src/`.
- Run `npm test`. Run `npm run typecheck` and `npm run build` before merging, because the build type-checks test files too.

## Where to read next

- [routing.md](routing.md): the route table, guards, and typed path helpers.
- [components.md](components.md): props and status for each shared component.
- [styling.md](styling.md): tokens and CSS module migration.
- [IMPLEMENTATION.md](IMPLEMENTATION.md): the feature guide, role rules, and the maintenance checklist.
