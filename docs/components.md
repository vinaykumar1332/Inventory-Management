# Shared components

Written for: engineers choosing a component for a screen, and reviewers checking a new one.

Import shared domain components from `@/components/common` and UI primitives from `@/components/ui`. The **Use** column shows how many files render each component today. A count of 0 means the component exists but no screen uses it yet. Those adoptions are tracked in Phase 3 of the revamp.

## Layout

| Component | Props | Use | Notes |
|---|---|---|---|
| `PageHeader` | `title`, `subtitle?`, `actions?`, `children?` | Pages | Title row with optional action buttons |
| `PageLayout` | `title`, `subtitle?`, `actions?`, `toolbar?`, `aside?`, `children` | 12 | Standard page frame. Pages should use this instead of their own header |
| `Aside` | `children`, `className?`, `width?: 'sm' \| 'md' \| 'lg'` | 0 | Secondary column; stacks below content on phones |
| `DashboardGrid` | `widgets: Record<string, ReactNode>` | 1 | Places widgets in the rows from `layout.json` → `dashboard.rows`. Each widget takes `dashboard.spans[id]` columns (default 1). Missing widgets are skipped |
| `SidePanel` | `open`, `onClose`, `title`, `description?`, `width?: 'sm' \| 'md' \| 'lg'`, `footer?`, `dismissible?`, `children` | 7 | The one panel for details and forms. Desktop: side sheet. Phone: full-height drawer. `dismissible={false}` ignores Escape and the backdrop |
| `TabsContent` / `PageTabs` | `value`, `onChange`, `tabs: { value, label, count? }[]`, `listClassName?`, `children` | Pages | Declarative tabs on Radix Tabs |

## Data display

| Component | Props | Use | Notes |
|---|---|---|---|
| `KpiCard` | `label`, `value`, `sub?`, `icon`, `tone?`, `to?` | 4 | Number tile. `to` makes it a link |
| `KpiGrid` | `children`, `className?` | Pages | Responsive grid for KPI cards |
| `SectionCard` | see `DataDisplay.tsx` | Pages | Titled card section |
| `ProductIcon` | `icon`, `size?: 'sm' \| 'md' \| 'lg'` | Pages | Product category icon |
| `BarStrip` | `items: BarItem[]`, `className?`, `emptyLabel?` | Pages | Fixed-height column chart. Zero values draw no bar |
| `ResponsiveTable` | `columns`, `rows`, `rowKey`, `empty?`, `loading?`, `initialSort?`, `pageSize?`, `caption?`, `rowActions?`, `actionsLabel?`, `onRowClick?` | 8 | One list component: sortable table on desktop, cards on phones. See below |
| `DataTable` helpers | `useTableState`, `SortHeader`, `Pagination` | Pages | Used by `ResponsiveTable` and by tables that need custom markup |
| `TruncatedList` | see file | Pages | Shows the first items with a "+N more" control |

### `ResponsiveTable`

```tsx
<ResponsiveTable
  caption="Batches"
  rows={batches}
  rowKey={(b) => b.id}
  initialSort={{ key: 'expiry', dir: 'asc' }}
  columns={[
    { key: 'product', header: 'Product', cell: (b) => b.productName, sortValue: (b) => b.productName },
    { key: 'expiry', header: 'Expiry', cell: (b) => <ExpiryCell date={b.expiryDate} />, sortValue: (b) => b.expiryDate },
    { key: 'qty', header: 'Qty', cell: (b) => b.qtyAvailable, sortValue: (b) => b.qtyAvailable, align: 'right' },
    { key: 'site', header: 'Site', cell: (b) => b.siteName, hideOnMobile: true },
  ]}
  empty={<EmptyState title="No batches" />}
/>
```

- The first column is the card title on phones. Other columns become label and value rows, except those marked `hideOnMobile`.
- A column is sortable only when it has `sortValue`.
- `className` on a column adds classes to its header and cells on desktop, for example `hidden 2xl:table-cell`. `hideOnMobile` drops the column from the cards.
- `rowActions` renders buttons or a menu for each row: the last column on desktop, the foot of each card on phones. Clicks inside it do not open the row.
- `onRowClick` opens a row. Keep a real button in the first cell so keyboard users can do the same.
- `loading` renders a `Loader`.

## Feedback

| Component | Props | Use | Notes |
|---|---|---|---|
| `Loader` | `label?`, `variant?: 'page' \| 'section' \| 'compact'`, `fullPage?`, `compact?`, `className?` | 16 | The only loading indicator. Brand mark in the centre |
| `Spinner` | `size?: 'md' \| 'lg'`, `className?` | Buttons | Inline spinner |
| `QueryState` | `query: { isLoading, isError, refetch }`, `isEmpty?`, `loading?`, `empty?`, `children` | 2 | Chooses between error, loading, empty and content |
| `EmptyState` | `icon?`, `title`, `description?`, `action?`, `className?` | Pages | |
| `ErrorState` | `onRetry?`, `message?` | Pages | |
| `AccessMessage` | `kind: 'notFound' \| 'forbidden'`, `backTo?` | 1 | Used by the route guard. Translated text in `auth.*` and `errors.*` |
| `ErrorBoundary` | `resetKey?`, `children` | 1 | Catches render errors in one part of the screen. Resets when `resetKey` changes |

## Status

| Component | Props | Use |
|---|---|---|
| `StockStatusBadge` | `status` | Pages |
| `ExpiryCell` | `date: string \| null` | Tables |
| `ExpiryBadge` | `bucket` | Pages |
| `BillStatusBadge` | `status` | Tables |
| `UploadTypeBadge` | `type` | Tables |
| `ToolStatusBadge` | `status`, `overdue?` | Tables |
| `ConditionBadge` | `condition` | Tables |
| `MovementBadge` | `type` | Tables |
| `SiteStatusBadge` | `status` | Sites |
| `SitePhaseBadge` | `phase` | Sites |
| `Logo`, `DemoBadge` | `className?`, `light?` / `compact?` | App shell |

## Inputs

| Component | Props | Use | Notes |
|---|---|---|---|
| `SearchInput` | `value`, `onChange`, `placeholder`, `className?`, `label?` | Lists | Search field with a clear button |
| `Segmented` | `value`, `onChange`, `options: { value, label, icon?, count? }[]`, `label`, `className?` | Lists | Radio-group style segmented control |
| `SiteSelect` | Select props, `includeAll?`, `showStore?` | Filters | Only sites the user can access |
| `CategorySelect` | Select props, `allLabel?` | Filters | Material categories from `catalog.json` |
| `FilterBar` | `children`, `className?` | Lists | Filter row above a list |

## UI primitives (`@/components/ui`)

| Component | Variants or props | Notes |
|---|---|---|
| `Button` | `variant`: `primary` (default), `secondary`, `ghost`, `danger`, `success`, `warning`, `soft`, `link`. `size`: `sm`, `md`, `lg`, `icon`. `loading`, `asChild`, `fullWidth` | Defaults to `type="button"`. With `asChild`, pass exactly one child element |
| `IconButton` | As `Button`, `aria-label` required | Square icon button |
| `Badge`, `StatusPill`, `Tag` | `tone`: `neutral`, `primary`, `accent`, `success`, `warning`, `danger`, `info`, `navy` | `StatusPill` and `Tag` are aliases |
| `Card` | `variant`: `default`, `outlined`, `flat`, `interactive` | With `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Text` | Typography props | See `display/Text.tsx` |
| `Avatar` | See `display/Avatar.tsx` | |
| `Table`, `TableWrap`, `THead`, `TBody`, `TR`, `TH`, `TD` | | Plain table markup |
| `Stack`, `Divider` | Layout helpers | `layout/` |
| `Input`, `inputClass` | Input props | Use `inputClass` only when you need the class on a non-input element |
| `Select`, `Checkbox`, `Textarea` | Standard props | |
| `Switch` | Input props (`type` is fixed to checkbox, role `switch`) | |
| `RadioGroup`, `Radio` | See `form/Radio.tsx` | |
| `Field`, `FormField` | `label`, `htmlFor`, `error?`, `hint?`, `required?` | Label, control and message together |
| `Dialog`, `ConfirmDialog` | `title`, `footer`, `tone`, `confirmLabel`, `onConfirm`, `loading` | Modal dialogs |
| `Sheet` | `size`: `md`, `lg`, `xl`, `title`, `description`, `footer` | Used by `SidePanel` |
| `DropdownMenu`, `Tooltip` | Radix wrappers | |
| `Tabs` | Radix wrappers | Use `PageTabs` for page-level tabs |

## Access

| Component | Props | Notes |
|---|---|---|
| `<Can>` | `permission`, `children`, `fallback?` | Renders children only when `can(permission)` is true. Use it to hide a control. The API still checks |

## Rules for new shared components

1. Put it in `components/common/<area>/` for domain UI, or `components/ui/<area>/` for generic primitives.
2. Export it from the folder's barrel (`components/common/index.ts` or `components/ui/index.ts`).
3. Use tokens for colours, spacing and radii. Use a `.module.css` file for layout that needs media queries or states Tailwind does not express cleanly.
4. Take all visible text from props or `t()`. Add new keys to `en`, `hi` and `te`.
5. Add a test next to the component for its behaviour (see `ResponsiveTable.test.tsx` and `SidePanel.test.tsx`).
6. Add a row to this file.
