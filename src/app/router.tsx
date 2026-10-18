import * as React from 'react'
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Permission } from '@/lib/permissions'
import { AppLayout } from '@/components/layout/AppLayout'
import { EmptyState } from '@/components/common'
import { Button, Skeleton } from '@/components/ui'
import LoginPage from '@/pages/LoginPage'

// Route-level code splitting: chart-heavy pages and the Excel feature load on demand.
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
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
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
            <Link to="/dashboard">{t('auth.goToDashboard')}</Link>
          </Button>
        }
        className="py-24"
      />
    )
  }
  return <React.Suspense fallback={<PageFallback />}>{children}</React.Suspense>
}

function NotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={t('errors.pageNotFound')}
      description={t('errors.pageNotFoundHint')}
      action={
        <Button asChild>
          <Link to="/dashboard">{t('auth.goToDashboard')}</Link>
        </Button>
      }
      className="py-24"
    />
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Guard><DashboardPage /></Guard> },
          { path: 'sites', element: <Guard><SitesPage /></Guard> },
          { path: 'sites/:siteId', element: <Guard><SiteDetailPage /></Guard> },
          { path: 'inventory', element: <Guard><InventoryPage /></Guard> },
          { path: 'bills', element: <Guard permission="view_bills"><BillsPage /></Guard> },
          { path: 'upload', element: <Guard permission="upload_bills"><UploadBillPage /></Guard> },
          { path: 'movements', element: <Guard><MovementsPage /></Guard> },
          { path: 'alerts', element: <Guard><AlertsPage /></Guard> },
          { path: 'tools', element: <Guard><ToolsPage /></Guard> },
          { path: 'reports', element: <Guard permission="view_reports"><ReportsPage /></Guard> },
          { path: 'admin', element: <Guard permission="manage_users"><AdminPage /></Guard> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
