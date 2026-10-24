# SiteSeal Inventory: Implementation Guide

This document explains what is built in the SiteSeal Inventory client demo: roles and permissions, routing, data, storage, network handling, the PWA, and the upload and alert flows. It describes the code as it is today. Where the code differs from an earlier decision, that is called out in [Known gaps](#11-known-gaps-and-open-decisions).

> **Scope.** This is a browser-only demo. There is no server, no real authentication, no OCR and no cloud storage. All data comes from JSON files in `src/data/mock/` and lives in memory.

---

## 1. Quick start

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server. The service worker and manifest are disabled in dev. |
| `npm run typecheck` | Runs `tsc -b --noEmit`. |
| `npm run build` | Runs the type check, then the production build and the PWA service worker. |
| `npm run preview` | Serves the production build. Use this to test install, offline and the service worker. |

There is no automated test suite in `package.json`. Verification is the type check, the production build, and manual testing.

Demo sign-in accounts are listed in section 2.4.

---

## 2. Roles, permissions and access

### 2.1 Roles

Three roles. The role type is in `src/types/index.ts` (`Role`); the access table is in `src/config/roles.json`.

| Role | Label | Sees | What it does |
|---|---|---|---|
| `super_admin` | Super Admin | All sites | Final approver. Creates Admins and Site Managers, approves Admin submissions, adjusts stock and grants expiry exceptions directly. |
| `admin` | Admin | All sites | Creates and edits Site Managers and sites, assigns managers (with Super Admin approval), approves Site Manager submissions. Cannot create Admins. |
| `site_manager` | Site Manager | Assigned sites only | Uploads bills and records stock use, damage and receipts. Every such change needs Admin approval. Cannot approve anything. |

The former `storekeeper` role has been removed everywhere: types, config, translations, users, quick login and the create-site form.

### 2.2 What each role can do

Each governed action has one of three modes: **direct** (applied at once), **needs approval** (stored as a pending approval, nothing changes until someone approves) or **not allowed**. The table lives in `src/config/roles.json` under `actions`.

| Action | Super Admin | Admin | Site Manager |
|---|---|---|---|
| Upload a bill (`bill.upload`) | Direct | Direct | Needs approval (Admin) |
| Approve a bill into stock (`bill.approve`) | Direct | Direct | Needs approval (Admin) |
| Issue, return, transfer, record damage (`stock.issue`, `stock.return`, `stock.transfer`, `damage.report`) | Direct | Direct | Needs approval (Admin) |
| Adjust stock (`stock.adjust`) | Direct | Needs approval (Super Admin) | Not allowed |
| Expiry exception (`expiry.override`) | Direct | Needs approval (Super Admin) | Not allowed |
| Create a site (`site.create`) | Direct | Direct | Not allowed |
| Assign or change a site's manager (`manager.assign`) | Direct | Needs approval (Super Admin) | Not allowed |
| Create a Site Manager (`user.create`) | Direct | Direct | Not allowed |
| Create an Admin | Direct | Not allowed | Not allowed |
| Edit a user (`user.update`) | Direct | Direct, except Admin accounts | Not allowed |
| Change a user to or from Admin | Direct | Needs approval (Super Admin) | Not allowed |
| View bills of assigned sites (`view_bills`) | Yes | Yes | Yes |
| View reports (`view_reports`) | Yes | Yes | Yes |
| View audit log (`view_audit_log`) | Yes | Yes | No |
| Manage tools (`manage_tools`) | Direct | Direct | Not allowed (see section 11) |

Approvals are routed by the submitter's role:

- A Site Manager's submission goes to an **Admin** (any Admin can approve it).
- An Admin's submission goes to a **Super Admin**.
- A Super Admin's change is applied directly and is not routed.
- Nobody can approve their own submission. A submitter can cancel their own pending request.

Screens and buttons check the same table through `can()` / `describeAccess()` in `src/lib/permissions.ts`. Permission names such as `upload_bills` or `stock_adjustment` are aliases for these actions, so a button appears when the user may either act directly or submit for approval.

### 2.3 Site scope

Permissions and site scope are separate checks.

- `accessibleSiteIds()` in `src/api/selectors.ts` decides which sites a user sees. Super Admins and Admins see all sites. A Site Manager sees only the sites in `siteIds`.
- Each site has one primary manager (`managerId`) and optional backup managers (`backupManagerIds`). Both are kept in step with each manager's `siteIds`.
- A site with no primary manager is saved in **Setup** status and raises a "No site manager" alert.
- The UI and the mock API both filter by site, so a Site Manager cannot read or change another site's data.

### 2.4 Demo accounts

Sign-in is by email. The password field must be filled in, but its value is not checked.

| Quick-login button | Email | Name | Role | Sites |
|---|---|---|---|---|
| Super Admin | `superadmin@demo.com` | Ramesh Reddy | `super_admin` | All |
| Admin | `admin@demo.com` | Priya Sharma | `admin` | All |
| Site Manager | `manager@demo.com` | Anil Varma | `site_manager` | s1 (primary), s2 (primary) |

Other seeded users in `users.json`: Meena Rao (`admin`, all sites), Suresh Kumar (backup for s1), Lakshmi Prasad (backup for s2), Kiran Rao (backup for s3), Venkat Naidu (primary for s3). Quick-login emails are set in `src/config/app.json` under `demo.quickLoginEmails`.

### 2.5 Enforcement

1. **One rule table.** `describeAccess(role, key)` in `src/lib/permissions.ts` returns `direct`, `needs_approval` or `forbidden`. The sidebar, the route guards, the buttons and the permission matrix on the Users page all use it.
2. **Mock API.** Every governed write calls `authorizeAction(db, action)`, then `submit()` in `src/api/mockApi.ts`. `submit()` applies a direct change through an applier function, or stores a pending `Approval` that keeps the original input. Nothing is modified until the approval is accepted.
3. **Conflicts.** Each approval stores a fingerprint of the record it would change (`snapshotFor()` in `src/api/approvals.ts`). If the record changed before approval, the approval becomes a **conflict** and nothing is applied.

> The client-side checks are not security. A real backend must enforce every rule on the server. Hiding a button does not protect data.

---

## 3. Authentication, sessions and onboarding

- **Entry point.** `/` redirects to `/login` when signed out and to `/dashboard` when signed in.
- **Login.** The email is looked up (case-insensitive). An unknown email shows `auth.unknownUser`. A disabled account shows `auth.accountDisabled` and is refused. The password is not checked; the login page says so.
- **First login.** Users created through the app have `firstLoginCompleted: false`. Their first screen is a "Confirm your profile" dialog showing name, designation and phone. Confirming records it and the dialog does not appear again.
- **Protected routes.** `RequireAuth` redirects unauthenticated visitors to `/login`, keeping the original URL, so they return to it after sign-in.
- **Logout.** The profile menu's Sign out goes to `/logout`, which clears the session and returns to `/login`.
- **Session expiry.** When an API call returns `errors.sessionExpired`, the app clears its cache and returns the user to sign-in.
- **Session storage.** The session is a cookie with no `Max-Age`, so it ends when the browser closes (section 6).
- **Cross-tab sync.** Signing in or out in one tab does not update other open tabs until they reload.

---

## 4. Routing and navigation

### 4.1 Route table

Defined in `src/app/router.tsx`. Paths come from `src/config/navigation.json`.

| Path | Access | Screen |
|---|---|---|
| `/` | Public | Redirects to `/login` or `/dashboard` |
| `/login` | Public | Sign-in with quick-login buttons |
| `/logout` | Public | Signs out and redirects to `/login` |
| `/dashboard` | Signed in | Dashboard: KPIs, expiry lanes, charts, activity |
| `/sites` | Signed in | Sites list (grid or table; the choice is kept in a cookie). Create site: `manage_sites` |
| `/sites/:siteId` | Signed in | Site detail with tabs (overview, stock, batches, bills, usage, tools, reports) |
| `/inventory` | Signed in | Product-wise stock across sites, product drawer |
| `/upload` | `upload_bills` | Bill upload wizard (submits for approval for Site Managers) |
| `/bills` | `view_bills` | Bills list |
| `/movements` | Signed in | Stock movement log |
| `/tools` | Signed in | Tools list, issue, return, maintenance |
| `/alerts` | Signed in | Alert centre: filters, read and resolve, expiry exceptions |
| `/approvals` | Signed in | Waiting for me, My submissions, History. Badge shows waiting count |
| `/reports` | `view_reports` | Downloadable Excel reports |
| `/admin` | `manage_users` | Users and access: user list, add, edit, enable or disable, permission matrix |
| Any other path | Public | 404 page with a "did you mean" suggestion |

Old and misspelt links (for example `/dashbord`, `/signin`, `/home`) redirect through `routes.aliases` in `navigation.json`.

### 4.2 Navigation

- The sidebar and the mobile bottom bar are both built from `navigation.json`. Items with a `permission` are hidden when the user lacks it.
- Alerts shows the number of unread, unresolved alerts. Approvals shows the number of approvals waiting for the current user.
- On phones the bottom bar shows the main items and a More sheet with every item, plus theme and install.

---

## 5. Data layer

### 5.1 Mock backend

| Piece | File | Notes |
|---|---|---|
| Mock JSON | `src/data/mock/*.json` | Users, sites, products, batches, invoices, movements, tools, staff, vendors, audit logs, approvals. |
| Loader | `src/data/index.ts` | Loads the JSON and shifts dates relative to `meta.json`. |
| In-memory DB | `src/api/db.ts` | Built once per page load. Pending approvals get their fingerprints when it loads. A reload restores the mock data. |
| API | `src/api/mockApi.ts` | The only data entry point. Each call waits `delay()` (about 300 to 700 ms) and returns a copy. |
| Approvals | `src/api/approvals.ts` | Fingerprints, row building and the per-user approval lists. |
| Derived views | `src/api/selectors.ts` | Dashboard, stock rows, site summaries (primary and backup managers), alerts. |
| Hooks | `src/hooks/queries.ts` | TanStack Query hooks, `useApiMutation`, `useApprovals`, `useWaitingApprovalCount`. |

### 5.2 API functions

| Group | Functions |
|---|---|
| Auth | `login`, `logout`, `getCurrentUserSync`, `getDemoAccounts`, `confirmProfile` |
| Users | `getUsers`, `createUser`, `updateUser` (also used to enable or disable) |
| Sites | `getDashboard`, `getSites`, `getSite`, `createSite`, `assignManager`, `getSiteDirectory`, `getCompany`, `getPublicSummary` |
| Stock | `getStock`, `getProducts`, `getProductById`, `getBatches`, `getMovements`, `issueMaterial`, `returnMaterial`, `transferStock`, `reportDamage`, `adjustStock`, `createProductRequest` |
| Bills | `findDuplicateInvoice`, `uploadBill`, `matchProduct`, `extractBill`, `saveBillDraft`, `approveBill`, `rejectBill`, `archiveBill`, `getBills`, `getBill` |
| Approvals | `listApprovals(scope)`, `approveRequest`, `rejectRequest`, `cancelRequest` |
| Alerts | `getAlerts`, `updateAlerts`, `sendReminder`, `approveExpiryException` |
| Tools | `getTools`, `issueTool`, `returnTool`, `reportToolDamage`, `completeMaintenance` |
| Reports | `exportReport` |
| Admin | `resetDemoData` |

A governed write returns either its normal result, or `{ status: 'pending', approvalId }` when it needs approval. `useApiMutation` shows an "approval sent" notice in that case instead of a success message.

### 5.3 Mutations

Every write goes through `useApiMutation`. Identical requests that are still in flight are shared (a double click makes one call). On success it shows the toast and refreshes the affected queries. On error it shows a translated message from `ApiError.key`.

### 5.4 Alert rules

Alerts are derived from live data each time they are requested. Read and resolved flags are kept with the mock DB.

| Alert type | Rule |
|---|---|
| `expired` | A batch with stock left whose expiry date is past. Critical. |
| `expiring_7`, `expiring_15`, `expiring_30` | Expiry within 7, 15 or 30 days (`expiryWindowsDays` in config). Critical for 7 days, warning otherwise. |
| `low_stock` | Available quantity below the product's `reorderLevel`. Shows a suggested order. |
| `tool_overdue` | An issued tool whose expected return date has passed. |
| `pending_approval` | A bill in `needs_review` status that is not archived. |
| `no_manager` | A site with no primary Site Manager. Opens the site. |

Batches with an approved expiry exception produce no expiry alert. Only Super Admins can grant one (it is a governed action).

---

## 6. Storage

No data is written to `localStorage` or `sessionStorage`.

| Cookie name (prefix `siteseal:`) | Lifetime | Content | Written by |
|---|---|---|---|
| `session` | Browser session (no `Max-Age`) | `{ userId }` | `api/session.ts` |
| `lang` | 1 year | Language code (`en`, `hi`, `te`) | `i18n/index.ts` |
| `theme` | 1 year | `light`, `dark` or `system` | `theme/ThemeProvider.tsx` |
| `sidebarCollapsed` | 1 year | Desktop sidebar state | `AppLayout` |
| `sitesView` | 1 year | `grid` or `table` | `SitesPage` |

Rules in `src/lib/storage.ts`: `Path=/`, `SameSite=Lax`, `Secure` on HTTPS; values over about 3500 characters are not written; `clearAppCookies()` expires every app cookie. The session cookie is set from JavaScript, so it cannot be `HttpOnly`. This is acceptable only for the demo.

The inline script in `index.html` reads the `theme` cookie before the first paint.

---

## 7. Network handling

### 7.1 Network state

`useNetworkState()` in `src/features/pwa/hooks/useNetworkState.ts` returns `online`, `slow` or `offline`.

- **Offline:** `navigator.onLine` is false.
- **Slow:** the Network Information API reports `effectiveType` of `slow-2g`, `2g` or `3g`, a round-trip time above 600 ms, or Data Saver is on.
- **Browser support:** Chrome, Edge and Android. Safari and iOS do not support the API, so there only offline detection works.

### 7.2 What the user sees

| State | Header banner | Toast | Motion | Install button | Uploads and submits |
|---|---|---|---|---|---|
| Online | None | None | Normal | Enabled | Run immediately |
| Slow | "Slow or weak connection" | Warning | Disabled | Enabled | Ask for confirmation first (upload only) |
| Offline | "You are offline" | Error | Disabled | Disabled, tooltip explains why | Blocked with a message |

`NetworkMonitor` uses one toast id, so changes replace the previous toast.

---

## 8. Controls for user actions

### 8.1 Duplicate-request control (`useApiMutation`)

- Identical requests still in flight are shared. The key is the JSON form of the variables.
- Different variables run separately, so archiving two bills in one table works.
- `mutate` ignores a repeat call while the same request runs; `mutateAsync` returns the in-flight promise.
- `isPending` is still available to disable buttons.

### 8.2 Guarded action (`useGuardedAction`)

Used for uploads (`src/hooks/useGuardedAction.tsx`).

| Condition | Behaviour |
|---|---|
| A run is already in progress | Ignored |
| Offline | Blocked, shows `network.offlineToast` |
| Slow | Confirmation dialog first. Only "Upload anyway" starts the action |
| Online | Starts immediately |

---

## 9. Upload and approval flow

Route: `/upload` (`src/pages/UploadBillPage.tsx`). Permission: `upload_bills`.

| Step | Screen | What happens |
|---|---|---|
| 1 | Site | Choose a site the user can access |
| 2 | File | Choose an Excel, PDF or image file. A duplicate file name is flagged. Upload runs through `useGuardedAction` |
| 3 | Processing | `uploadBill` records the bill and `extractBill` runs the mock extraction. For a Site Manager the bill is also submitted for approval (`bill.upload`) |
| 4 | Review | Edit header and line items. Save a draft at any time. Reject needs `approve_bills` and is not available to Site Managers |
| 5 | Confirm | Approve. For a Site Manager this submits `bill.approve`; stock changes only after an Admin approves |

Bill statuses: `draft`, `processing`, `needs_review`, `approved`, `rejected`. Archived bills are hidden.

### 9.1 Approvals page

Route `/approvals`. Three tabs:

- **Waiting for me** — pending requests you may approve. Approve, or Reject with a written reason.
- **My submissions** — your requests. Cancel any that are still pending.
- **History** — completed requests you submitted or could review.

Each row shows the action, the site, who submitted it and when, the status, and a reason where rejected. A conflict is labelled and asks for a resubmission.

### 9.2 Users and sites

- **Users and access** (`/admin`): Admins and Super Admins can add users, edit them and enable or disable them. A duplicate email, phone or employee ID is refused and the message names the existing user. The permission matrix shows Direct, Needs approval or Not allowed per role.
- **Create site** (Sites page): primary and backup manager are optional. Without a primary manager the site is saved in Setup and an alert appears.
- **Change manager** (site detail): needs Super Admin approval when submitted by an Admin.
- **Edit site** (site detail, Super Admin only, action `site.update`): change details, status (Setup, Active, On hold, Completed), progress, primary and backup managers, and the assigned admin. Applied at once and written to the audit log. A site cannot be set to Active without a primary manager, and codes must stay unique.
- On-hold and completed sites still accept stock movements. Blocking them is not implemented yet.

---

## 10. PWA

### 10.1 Manifest and install

- Generated by `vite-plugin-pwa` from `vite.config.ts`: standalone display, theme colours, icons (64, 192, 512 and a maskable 512), shortcuts to Upload, Inventory and Alerts.
- Install uses the browser's `beforeinstallprompt`. Browsers without it (iOS Safari, Firefox) get a guide dialog.
- Install is offered in the More sheet and the profile menu; it is hidden when the app runs standalone.

### 10.2 Service worker

Source: `src/sw.ts`, built with `injectManifest`, `prompt` update mode.

| Part | Behaviour |
|---|---|
| Precache | App shell: JS, CSS, HTML, SVG, PNG, ICO and Latin font files. The Excel chunk loads on demand |
| Navigation | Every page load is served from the precached `index.html` (fast, works offline) |
| `/api/*` | Network first, cached as `api-cache` (placeholder for a real backend) |
| Old caches | `cleanupOutdatedCaches()` removes caches from earlier builds |
| Updates | A toast offers "Update now": it posts `SKIP_WAITING`, the new worker activates and the page reloads |
| Push | Shows a notification on `push`; opens same-origin URLs only. Not connected to a sender in the demo |

### 10.3 App icon badge

`useAppBadge` in `AppLayout` sets the icon badge to the number of unread alerts (where `navigator.setAppBadge` is supported).

### 10.4 Launch and transitions

- A launch screen in `index.html` shows before any JavaScript runs; `hideBootSplash()` removes it when the app mounts.
- Each page fades and slides in on route change.

---

## 11. Known gaps and open decisions

| # | Item | Status |
|---|---|---|
| 1 | **Tools are not routed through approval.** Tool issue, return and maintenance are direct for Super Admin and Admin. Site Managers cannot use them. | Open. Route tool actions through `submit()` if wanted |
| 2 | **Draft saves are direct.** Saving a bill draft is not an approval; only the approve step is governed | Decision: keep |
| 3 | **No before/after diff** in the approvals list. The row shows a summary, not the full before and after values | Open |
| 4 | **Only one backup manager** per site (the spec asked for several) | Open |
| 5 | **No "created by / updated by" names** on batch and tool rows. Stock movements already show the user | Open |
| 6 | **No change history** on the site team section | Open |
| 7 | **Pending items do not move** when a manager changes. Routing is by submitter role, so they stay in the Admin queue | Behaviour as built |
| 8 | **Mock data resets on reload.** Bills, stock edits, approvals and users live in memory; only the session and preferences persist | By design for the demo |
| 9 | **Client-side checks only.** Every rule must be enforced on a real server | Required before real data |
| 10 | **Cross-tab sign-in sync** is gone after moving the session to cookies | Known |
| 11 | **Push notifications** are wired on the worker but have no sender | Needs a backend and VAPID keys |
| 12 | **Slow-network detection** only works where the Network Information API exists | Known |
| 13 | **Startup size.** Mock data (about 296 kB raw) loads at startup because session lookup reads it | Known |
| 14 | **Confirmation on uploads only.** Other submits get duplicate-request protection, not the slow-network confirmation | Open |
| 15 | **Password is not checked** in the demo | Expected for demo |

Acceptance checks run against the mock API (not in a browser): site manager submissions stay pending and do not change stock; admins approve site manager work; super admins approve admin work; self-approval is refused; stale submissions become conflicts; Admins cannot create Admins; duplicate email is refused and names the existing user; disabled users cannot sign in; manager changes by Admins need Super Admin approval.

---

## 12. Internationalisation and configuration

- **Languages:** English (`en`), Hindi (`hi`), Telugu (`te`). Locale files are in `src/i18n/locales/`. Hindi and Telugu are type-checked against English, so a missing key fails the build.
- **Fonts:** Inter is self-hosted and loaded globally. Noto Sans Devanagari and Noto Sans Telugu load only when their language is selected.
- **Configuration files** in `src/config/`:

| File | Holds |
|---|---|
| `app.json` | App name, versions, storage prefix, quick-login emails, API delay, feature flags |
| `roles.json` | Roles and the role-to-permission matrix |
| `navigation.json` | Sidebar and bottom-bar items, route paths, aliases |
| `catalog.json` | Alert types and tones, site status and phase tones, stock status, tool statuses, bill statuses |
| `dashboard.json` | Dashboard KPI cards and widgets |
| `business.json` | Business rules (upload hints, report defaults) |
| `theme.json` | Colour tokens, injected as CSS variables at startup |

- Icons are named in config and resolved in `src/config/icons.ts`. Colour classes for tones and tints are in `src/config/tones.ts`.
- Rule: no label, colour, limit or icon name is hard-coded in components. If you need one, add it to config or the locale files.

---

## 13. Folder structure

```text
src/
  app/                  App root, router, route table, providers, splash helper
  pages/                One file per route (lazy-loaded)
  features/             One folder per domain
    auth/  dashboard/  sites/  inventory/  bills/ (+ upload/)  stock/  tools/
    reports/  alerts/  admin/  pwa/
    access/      Role-based access: permission table helpers, <Can>, access matrix
    approvals/   Approval engine (submit, approve, reject, cancel), approval hooks and UI
  components/
    ui/                 Primitives: button, display, form, overlay
    common/             Shared domain components: status badges, PageHeader, DataTable...
    layout/             AppLayout, Sidebar, MobileNav, header controls, UserMenu
  api/                  Mock API, in-memory DB, session, derived views
  data/                 Mock JSON and date shifting
  config/               JSON configuration and typed accessors
  i18n/                 i18n setup and locales/
  hooks/                Shared hooks: queries, guarded action, media query
  lib/                  Permissions, cookie storage, utilities, platform checks
  theme/                Theme provider and token injection
  types/                Domain types
  utils/                Formatting, dates, calculations, Excel helpers
  sw.ts                 Service worker
  main.tsx              Entry point
```

### Where new code goes

| I want to add… | Put it in |
|---|---|
| A new screen | `src/pages/`, plus a route in `src/app/router.tsx` |
| A reusable button, input or dialog | `src/components/ui/` |
| UI used by one feature | `src/features/<name>/components/` |
| A data call | A function in `src/api/mockApi.ts`, wrapped in a hook in `src/hooks/queries.ts` |
| An action that sends data | Wrap it with `useGuardedAction`, and use `useApiMutation` for mutations |
| Visible text | `src/i18n/locales/*.json` (all three languages) |
| A number, colour, label or limit | `src/config/*.json` |
| A new permission | `src/lib/permissions.ts` (type), `src/config/roles.json` (matrix), and the `Guard` or `can()` check where it is used |

---

### Loading and pages

- **One loader:** `Loader` and `Spinner` in `src/components/common/loader/` (`Loader.tsx` and `Loader.css`) is the only loading indicator. It is centred, has a spinner and the translated label (`common.loading`). The centre shows the SiteSeal mark. Use `<Spinner />` for buttons and inline actions. Use `<Loader />` for sections, `<Loader compact />` inside cards and drawers, and `<Loader fullPage />` for whole screens. `QueryState` shows it by default. Skeleton placeholders are no longer used.
- **Page subfolders:** pages live in `src/pages/<domain>/` (auth, errors, dashboard, sites, inventory, bills, movements, alerts, approvals, tools, reports, admin). Add a new page to the folder of its domain and register it in `src/app/router.tsx`.

---

## 14. Maintenance checklist

Before merging a change:

1. `npm run typecheck` passes.
2. `npm run build` passes, and the bundle sizes printed are as expected.
3. New text exists in all three locale files.
4. New permissions are added to the type, the matrix and the API `authorize` call.
5. Sign in as each demo role and check the screens and buttons that change.
6. For network or PWA changes, test in `npm run preview`, with DevTools network throttling and the offline toggle.
