import * as React from 'react'
import { Link, Navigate, Outlet, createBrowserRouter, useLocation, useNavigate, type RouteObject } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Permission } from '@/lib/permissions'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/common'
import { Button, Skeleton } from '@/components/ui'
import LoginPage from '@/pages/LoginPage'
import { ROUTES, locationToString } from './routes'

// Route-level code splitting: chart-heavy pages and the Excel feature load on demand.
const HomePage = React.lazy(() => import('@/pages/HomePage'))
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const SitesPage = React.lazy(() => import('@/pages/SitesPage'))
const SiteDetailPage = React.lazy(() => import('@/pages/SiteDetailPage'))
const InventoryPage = React.lazy(() => import('@/pages/InventoryPage'))
const BillsPage = React.lazy(() => import('@/pages/BillsPage'))
const UploadBillPage = React.lazy(() => import('@/pages/UploadBillPage'))
const MovementsPage = React.lazy(() => import('@/pages/MovementsPage'))
const AlertsPage = React.lazy(() => import('@/pages/AlertsPage'))
const ToolsPage = React.lazy(() => import('@/pages/ToolsPage'))
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'))
const AdminPage = React.lazy(() => import('@/pages/AdminPage'))

function PageFallback() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

const Lazy = ({ children }: { children: React.ReactNode }) => <React.Suspense fallback={<PageFallback />}>{children}</React.Suspense>

/** Protected area: unauthenticated visitors go to /login and come back to the exact link afterwards. */
function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: locationToString(location) }} />
  return <Outlet />
}

/** UI-only demo authorization — not real security. */
function Guard({ permission, children }: { permission?: Permission; children: React.ReactNode }) {
  const { t } = useTranslation()
  const { can, user } = useAuth()
  if (permission && !can(permission)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t('auth.accessDenied')}
        description={t('auth.accessDeniedBody', { role: t(`roles.${user?.role ?? 'storekeeper'}`) })}
        action={
          <Button asChild>
            <Link to={ROUTES.afterLogin}>{t('auth.goToDashboard')}</Link>
          </Button>
        }
        className="py-24"
      />
    )
  }
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
  { path: ROUTES.home, element: <Lazy><HomePage /></Lazy> },
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
