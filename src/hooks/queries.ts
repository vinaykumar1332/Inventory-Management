import * as React from 'react'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import * as api from '@/api/mockApi'
import type { MovementType, ReportFilters, ReportId, StaffRole } from '@/types'

export const queryKeys = {
  dashboard: (siteId: string) => ['dashboard', siteId] as const,
  sites: ['sites'] as const,
  site: (id: string) => ['site', id] as const,
  stock: (siteId: string) => ['stock', siteId] as const,
  products: ['products'] as const,
  product: (id: string, siteId: string) => ['product', id, siteId] as const,
  batches: (siteId?: string, productId?: string) => ['batches', siteId ?? 'all', productId ?? 'all'] as const,
  movements: (filter: object) => ['movements', filter] as const,
  bills: ['bills'] as const,
  bill: (id: string) => ['bill', id] as const,
  alerts: ['alerts'] as const,
  tools: ['tools'] as const,
  users: ['users'] as const,
  vendors: ['vendors'] as const,
  report: (id: ReportId, filters: ReportFilters) => ['report', id, filters] as const,
}

export function errorMessage(error: unknown) {
  if (error instanceof api.ApiError) return i18n.t(error.key, error.params)
  return i18n.t('errors.generic')
}

/** A governed write that is waiting for approval returns { approvalId } instead of a result. */
function isPendingResult(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'approvalId' in value
}

/* ---------- Queries ---------- */

export const useDashboard = (siteId = 'all') =>
  useQuery({ queryKey: queryKeys.dashboard(siteId), queryFn: () => api.getDashboard(siteId) })

export const useSites = () => useQuery({ queryKey: queryKeys.sites, queryFn: api.getSites })

export const useSiteDirectory = () =>
  useQuery({ queryKey: ['siteDirectory'], queryFn: api.getSiteDirectory, staleTime: 5 * 60_000 })

export const useSite = (id: string) => useQuery({ queryKey: queryKeys.site(id), queryFn: () => api.getSite(id) })

export const useStock = (siteId = 'all') =>
  useQuery({ queryKey: queryKeys.stock(siteId), queryFn: () => api.getStock(siteId) })

export const useProducts = () =>
  useQuery({ queryKey: queryKeys.products, queryFn: api.getProducts, staleTime: 5 * 60_000 })

export const useProduct = (id: string | null, siteId = 'all') =>
  useQuery({
    queryKey: queryKeys.product(id ?? '', siteId),
    queryFn: () => api.getProductById(id as string, siteId),
    enabled: !!id,
  })

export const useBatches = (siteId?: string, productId?: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.batches(siteId, productId),
    queryFn: () => api.getBatches({ siteId, productId }),
    enabled,
  })

export const useMovements = (
  filter: { siteId?: string; productId?: string; type?: MovementType; invoiceId?: string; limit?: number } = {},
  enabled = true,
) => useQuery({ queryKey: queryKeys.movements(filter), queryFn: () => api.getMovements(filter), enabled })

export const useBills = (enabled = true) => useQuery({ queryKey: queryKeys.bills, queryFn: api.getBills, enabled })

export const useBill = (id: string | null) =>
  useQuery({ queryKey: queryKeys.bill(id ?? ''), queryFn: () => api.getBill(id as string), enabled: !!id })

export const useAlerts = () => useQuery({ queryKey: queryKeys.alerts, queryFn: api.getAlerts })

/** Open (unread and unresolved) alerts: drives the nav badge and the app icon badge. */
export const useUnreadAlertCount = () => {
  const { data } = useAlerts()
  return data?.filter((a) => !a.read && !a.resolved).length ?? 0
}

export const useTools = () => useQuery({ queryKey: queryKeys.tools, queryFn: api.getTools })

export const useUsers = () => useQuery({ queryKey: queryKeys.users, queryFn: api.getUsers, staleTime: 5 * 60_000 })

export const useSiteLabour = (siteId: string) =>
  useQuery({ queryKey: ['labour', siteId], queryFn: () => api.getSiteLabour(siteId), enabled: !!siteId })

export const useSetAttendance = () =>
  useApiMutation(
    (v: { siteId: string; staffId: string; date: string; inAt?: string | null; outAt?: string | null }) =>
      api.setAttendance(v.siteId, v.staffId, v.date, { inAt: v.inAt, outAt: v.outAt }),
    { successKey: 'labour.saved' },
  )

export const useMarkArrived = () =>
  useApiMutation((v: { siteId: string; staffId: string }) => api.markArrivedNow(v.siteId, v.staffId), { successKey: 'labour.arrived' })

export const useMarkLeft = () =>
  useApiMutation((v: { siteId: string; staffId: string }) => api.markLeftNow(v.siteId, v.staffId), { successKey: 'labour.leftNow' })

export const useAddLabourMember = () =>
  useApiMutation((v: { siteId: string; name: string; phone: string; role: StaffRole }) => api.addLabourMember(v.siteId, v), { successKey: 'labour.memberAdded' })

export const useLabourLog = (siteId: string) =>
  useQuery({ queryKey: ['labourLog', siteId], queryFn: () => api.getLabourLog(siteId), enabled: !!siteId })

export const useVendors = () => useQuery({ queryKey: queryKeys.vendors, queryFn: api.getVendors, staleTime: 5 * 60_000 })

export const useReport = (id: ReportId, filters: ReportFilters, enabled = true) =>
  useQuery({ queryKey: queryKeys.report(id, filters), queryFn: () => api.exportReport(id, filters), enabled })

/* ---------- Mutations ---------- */

/**
 * Wraps a mock API mutation: shows a success toast, surfaces translated
 * errors, and refreshes every cached query so KPIs, alerts and tables
 * reflect the new stock movement immediately.
 *
 * Identical requests still in flight (double clicks) share one call.
 */
export function useApiMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  options: { successKey?: string; invalidate?: QueryKey[] } = {},
) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: async (result) => {
      if (isPendingResult(result)) toast.info(i18n.t('approvals.submitted'))
      else if (options.successKey) toast.success(i18n.t(options.successKey))
      if (options.invalidate) {
        await Promise.all(options.invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })))
      } else {
        await qc.invalidateQueries()
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const inFlight = React.useRef(new Map<string, Promise<TResult>>())
  const keyOf = (vars: TVars) => JSON.stringify(vars) ?? ''

  const mutateAsync = React.useCallback(
    (vars: TVars) => {
      const key = keyOf(vars)
      const existing = inFlight.current.get(key)
      if (existing) return existing
      const request = mutation.mutateAsync(vars).finally(() => inFlight.current.delete(key))
      inFlight.current.set(key, request)
      return request
    },
    [mutation.mutateAsync],
  )

  const mutate = React.useCallback(
    (
      vars: TVars,
      callbacks?: { onSuccess?: (result: TResult) => void; onError?: (error: unknown) => void; onSettled?: () => void },
    ) => {
      if (inFlight.current.has(keyOf(vars))) return
      void mutateAsync(vars)
        .then(callbacks?.onSuccess, (error: unknown) => callbacks?.onError?.(error))
        .finally(() => callbacks?.onSettled?.())
    },
    [mutateAsync],
  )

  return { ...mutation, mutate, mutateAsync }
}

/* ---------- Reference data ---------- */

export const useDemoAccounts = () => useQuery({ queryKey: ['demoAccounts'], queryFn: api.getDemoAccounts, staleTime: Infinity })

export const useCompany = () => useQuery({ queryKey: ['company'], queryFn: api.getCompany, staleTime: 5 * 60_000 })

export const usePublicSummary = () => useQuery({ queryKey: ['publicSummary'], queryFn: api.getPublicSummary, staleTime: 60_000 })
