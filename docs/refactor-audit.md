# Refactor audit (Phase 0)

Snapshot taken before any refactor edits. Used as the checklist for later phases.

## Size

| Item | Count |
|---|---|
| `.tsx` files | 86 |
| `.ts` files | 44 |
| Pages (`src/pages/**`) | 17 |

Largest components (candidates for splitting into feature components):

| Lines | File |
|---|---|
| 456 | `features/bills/upload/ReviewStep.tsx` |
| 402 | `features/stock/StockMovementSheet.tsx` |
| 369 | `features/bills/upload/Steps.tsx` |
| 344 | `features/tools/ToolComponents.tsx` |
| 329 | `features/inventory/ProductDrawer.tsx` |
| 293 | `pages/sites/SiteDetailPage.tsx` |
| 282 | `pages/bills/UploadBillPage.tsx` |
| 276 | `components/layout/Sidebar.tsx` |
| 261 | `pages/alerts/AlertsPage.tsx` |
| 215 | `features/sites/LabourTab.tsx` |

## Raw HTML instead of shared components

| Element | Occurrences outside `components/ui` |
|---|---|
| `<button>` | 14 |
| `<input>` | 5 |
| `<select>` | 1 |
| `<textarea>` | 1 |
| `<table>` | 1 |

These should move to `Button`, `Input`, `Select`, `Textarea` and `Table` in Phase 2 and 4.

## Hard-coded styling values

| Item | Occurrences |
|---|---|
| Hex colours in `.ts` / `.tsx` (outside i18n) | 41 |
| Tailwind palette classes (e.g. `text-blue-700`) | 10 |
| Arbitrary px / rem values (e.g. `w-[72px]`) | 31 |
| Inline `style={{…}}` | 7 |

Palette classes and hex values should become tokens in Phase 1. Inline styles should become classes in Phase 7.

## Duplicated blocks (2+ pages)

- KPI cards: dashboard, inventory, site overview, tools (`KpiCard` already shared, but wrapper grids repeat).
- Loading and empty states: many pages build their own `EmptyState` / `Loader` wrappers.
- Status badges: `StatusBadges.tsx` is shared; a few pages still style their own pills.
- Table rows: bills (`BillsTable`, site bills tab), tools (`ToolComponents`, site tools tab), stock (`StockTable`, site stock tab).
- Side panels: `ProductDrawer`, bill details, approval details, user sheet, site edit sheet each implement their own sheet layout.

## Routes

- All protected pages sit under `RequireAuth` → `AppLayout` (guard applied in `router.tsx`).
- Per-page permission guard via `page(path, element, permission)`.
- Public: `/`, `/login`, `/logout`, aliases, and the 404 route.
- No route renders a page without a guard or layout.

## Plan (phases)

1. **Tokens and theming.** Generate `tokens.css` from `theme.json`. Replace the 41 hex values and palette classes. Per-feature styles.
2. **Core primitives.** Button variants, Card variants, Badge tones, form primitives, Tabs, DataTable (mobile card view), KpiCard, Dialog / Drawer.
3. **Layout.** AppShell, Header, PageLayout, SidePanel (replaces inline drawers), Aside, PageTabs (deep-linkable), DashboardGrid from `dashboard.json`.
4. **Feature components.** Move page logic to feature folders. Replace the raw elements and duplicated blocks listed above.
5. **Routing.** Typed route helpers. Config-driven guards. NotFoundOrForbidden. Error boundary per layout.
6. **Config.** Remaining literals to config/locales. `ui.json`, `layout.json`, zod schema validation at startup.
7. **Performance.** Lazy heavy components, memo where measured, virtualise lists over 200 rows, skeletons that match layout.
8. **Accessibility and tests.** aria-labels, keyboard use, contrast checks, Vitest + RTL tests.
9. **Docs.** `architecture.md`, `styling.md`, `components.md`, `routing.md`.

## Decisions

- Styling: the user chose CSS modules. Phase 1 introduces `*.module.css` per component and removes Tailwind utilities component by component. Tailwind stays installed until the last component is converted.
- Dependencies: zod is already installed. Vitest and React Testing Library need approval before they are added (Phase 8).
