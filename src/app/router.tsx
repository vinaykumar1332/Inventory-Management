import * as React from 'react'
import { Navigate, Outlet, createBrowserRouter, useLocation, useNavigate, type RouteObject } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Permission } from '@/features/access'
import { AppLayout } from '@/components/shell/AppLayout'
import { AccessMessage, Loader } from '@/components/common'
import LoginPage from '@/pages/auth/LoginPage'
import { ROUTES, locationToString } from './routes'

// Route-level code splitting: chart-heavy pages and the Excel feature load on demand.
const NotFoundPage = React.lazy(() => import('@/pages/errors/NotFoundPage'))
const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage'))
const SitesPage = React.lazy(() => import('@/pages/sites/SitesPage'))
const SiteDetailPage = React.lazy(() => import('@/pages/sites/SiteDetailPage'))
const InventoryPage = React.lazy(() => import('@/pages/inventory/InventoryPage'))
const BillsPage = React.lazy(() => import('@/pages/bills/BillsPage'))
const UploadBillPage = React.lazy(() => import('@/pages/bills/UploadBillPage'))
const MovementsPage = React.lazy(() => import('@/pages/movements/MovementsPage'))
const AlertsPage = React.lazy(() => import('@/pages/alerts/AlertsPage'))
const ApprovalsPage = React.lazy(() => import('@/pages/approvals/ApprovalsPage'))
const ApprovalDetailPage = React.lazy(() => import('@/pages/approvals/ApprovalDetailPage'))
const ToolsPage = React.lazy(() => import('@/pages/tools/ToolsPage'))
const ReportsPage = React.lazy(() => import('@/pages/reports/ReportsPage'))
const AdminPage = React.lazy(() => import('@/pages/admin/AdminPage'))

function PageFallback() {
  return <Loader fullPage />
}

const Lazy = ({ children }: { children: React.ReactNode }) => <React.Suspense fallback={<PageFallback />}>{children}</React.Suspense>

/** The login page is the entry point: signed-in users go straight to the dashboard. */
function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? ROUTES.afterLogin : ROUTES.login} replace />
}

/** Protected area: unauthenticated visitors go to /login and come back to the exact link afterwards. */
function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: locationToString(location) }} />
  return <Outlet />
}

/** UI-only demo authorization — not real security. */
function Guard({ permission, children }: { permission?: Permission; children: React.ReactNode }) {
  const { can } = useAuth()
  if (permission && !can(permission)) return <AccessMessage kind="forbidden" />
  return <Lazy>{children}</Lazy>
}

function LogoutRoute() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  React.useEffect(() => {
    if (user) {
      logout()
      toast.success(t('auth.signedOut'))
    }
    navigate(ROUTES.login, { replace: true })
  }, [user, logout, navigate, t])
  return null
}

/** Old / misspelt links (navigation.json → routes.aliases) keep their query string. */
function AliasRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation()
  return <Navigate to={`${to}${search}${hash}`} replace />
}

const page = (path: string, element: React.ReactNode, permission?: Permission): RouteObject => ({
  path,
  element: <Guard permission={permission}>{element}</Guard>,
})

export const router = createBrowserRouter([
  /* Public */
  { path: ROUTES.home, element: <RootRedirect /> },
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.logout, element: <LogoutRoute /> },
  ...Object.entries(ROUTES.aliases).map(([from, to]) => ({ path: from, element: <AliasRedirect to={to} /> })),

  /* Protected app */
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          page('dashboard', <DashboardPage />),
          page('sites', <SitesPage />),
          page('sites/:siteId', <SiteDetailPage />),
          page('inventory', <InventoryPage />),
          page('bills', <BillsPage />, 'view_bills'),
          page('upload', <UploadBillPage />, 'upload_bills'),
          page('movements', <MovementsPage />),
          page('alerts', <AlertsPage />),
          page('approvals', <ApprovalsPage />),
          page('approvals/:approvalId', <ApprovalDetailPage />),
          page('tools', <ToolsPage />),
          page('reports', <ReportsPage />, 'view_reports'),
          page('admin', <AdminPage />, 'manage_users'),
        ],
      },
    ],
  },

  /* Anything else: standalone 404 (signed in or not) */
  { path: '*', element: <Lazy><NotFoundPage /></Lazy> },
])
