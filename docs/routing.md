# Routing

Written for: engineers adding or changing a screen, a link, or an access rule.

Routes are defined in `src/app/router.tsx` with react-router v7 (`createBrowserRouter`). Paths and aliases come from `src/config/navigation.json`, and the helpers are in `src/app/routes.ts`.

## Route table

| Path | Access | Screen | Notes |
|---|---|---|---|
| `/` | Public | `RootRedirect` | Goes to `/dashboard` when signed in, `/login` otherwise |
| `/login` | Public | `LoginPage` | Quick-login buttons from `app.json` |
| `/logout` | Public | `LogoutRoute` | Signs out, then goes to `/login` |
| `/dashboard` | Signed in | `DashboardPage` | |
| `/sites` | Signed in | `SitesPage` | Create site needs `manage_sites` (`?create=1` opens the sheet) |
| `/sites/:siteId` | Signed in | `SiteDetailPage` | Tabs: overview, stock, batches, bills, usage, tools, labour, reports |
| `/inventory` | Signed in | `InventoryPage` | `?product=` and `?productSite=` open the product drawer |
| `/bills` | `view_bills` | `BillsPage` | |
| `/upload` | `upload_bills` | `UploadBillPage` | `?invoice=` continues a bill |
| `/movements` | Signed in | `MovementsPage` | |
| `/alerts` | Signed in | `AlertsPage` | `?filter=` sets the alert type |
| `/approvals` | Signed in | `ApprovalsPage` | Tabs: waiting for me, my submissions, history |
| `/approvals/:approvalId` | Signed in | `ApprovalDetailPage` | Any signed-in user may open it; the actions depend on the role |
| `/tools` | Signed in | `ToolsPage` | `?tool=` opens the tool drawer |
| `/reports` | `view_reports` | `ReportsPage` | |
| `/admin` | `manage_users` | `AdminPage` | |
| `*` | Public | `NotFoundPage` | Suggests the closest real path |

Old and misspelt paths (for example `/dashbord`, `/signin`, `/home`) are listed under `routes.aliases` in `navigation.json`. `AliasRedirect` keeps the query string and hash.

## Guards

- **`RequireAuth`** wraps the protected area. A signed-out visitor goes to `/login` with `state.from` set to the exact link, so login returns them there.
- **`Guard`** wraps each page with the `page()` helper. If the route names a permission and `can()` returns false, the page renders `<AccessMessage kind="forbidden" />`. The page itself does not render.
- **`AppLayout`** wraps every protected page in `ErrorBoundary` with `resetKey={pathname}`. A crash in one page shows the error state and the shell (navigation, header) keeps working. Moving to another route clears the error.

The route guard is a convenience for the demo. The mock API checks the same permissions again in `authorize()`, so a direct call without the screen still fails.

## Adding a route

1. Add the page under `src/pages/<domain>/`.
2. Add a `React.lazy` import at the top of `router.tsx`.
3. Add a line in the protected children, for example `page('reports', <ReportsPage />, 'view_reports')`.
4. If the page should appear in the sidebar, add an item to `navigation.json` with a `labelKey`, an `icon`, and a `permission` if it is restricted.
5. Add the path to `paths` in `routes.ts` so links use the typed builder.

## Links in code

Do not write path strings in components. Use `paths` from `src/app/routes.ts`:

```tsx
import { paths } from '@/app/routes'

navigate(paths.site(site.id))
<Link to={paths.upload(invoiceId)}>...</Link>
<Link to={paths.inventory({ productId, siteId })}>...</Link>
```

| Builder | Result |
|---|---|
| `paths.dashboard`, `sites`, `bills`, `movements`, `alerts`, `approvals`, `reports`, `admin` | Fixed paths |
| `paths.site(siteId)` | `/sites/:siteId`, id is URL-encoded |
| `paths.approval(approvalId)` | `/approvals/:approvalId` |
| `paths.upload(invoiceId?)` | `/upload` or `/upload?invoice=…` |
| `paths.tools(toolId?)` | `/tools` or `/tools?tool=…` |
| `paths.inventory(opts?)` | `/inventory`, `?product=…`, and `&productSite=…` when `siteId` is given |

Query keys are built with `URLSearchParams`, so values are encoded consistently.

## Safe redirects

`safeRedirect(target, fallback)` accepts only in-app paths that start with a single `/`. It rejects external URLs, protocol-relative `//` targets, and the login and logout routes, and returns the fallback in those cases. Use it for any `?next=` or `state.from` value.

## Known gaps

- Unknown site and approval IDs still show each page's own error or empty state. A shared "not found or not allowed" screen (`AccessMessage kind="notFound"`) exists but is not wired to those routes yet. See the Phase 5 items in `docs/refactor-audit.md`.
