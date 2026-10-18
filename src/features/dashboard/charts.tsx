import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardConfig, type ChartPalette } from '@/config'
import { useChartPalette } from '@/theme/ThemeProvider'
import { formatINR, formatINRCompact, formatMonth } from '@/utils/format'
import type { DashboardData } from '@/types'

// Chart colours come from src/config/theme.json (light + dark): brand teal for
// single series; validated categorical order for multi-series, rest → "Other".

const axisProps = (c: ChartPalette) =>
  ({
    stroke: c.axis,
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  }) as const

const truncate = (max: number) => (v: string) => (v.length > max ? `${v.slice(0, max - 1)}…` : v)

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (v) => formatINR(v),
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  labelFormatter?: (l: string) => string
  valueFormatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-foreground">{labelFormatter ? labelFormatter(String(label)) : label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
          {p.name && <span>{p.name}:</span>}
          <span className="tabular font-medium text-foreground">{valueFormatter(Number(p.value))}</span>
        </p>
      ))}
    </div>
  )
}

export function StockBySiteChart({ data }: { data: DashboardData['stockBySite'] }) {
  const { t } = useTranslation()
  const c = useChartPalette()
  return (
    <div className="h-64" role="img" aria-label={t('dashboard.stockBySite')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={c.grid} />
          <XAxis type="number" {...axisProps(c)} tickFormatter={(v: number) => formatINRCompact(v)} />
          <YAxis type="category" dataKey="siteName" {...axisProps(c)} width={120} tickFormatter={truncate(18)} />
          <Tooltip cursor={{ fill: c.grid, fillOpacity: 0.4 }} content={<ChartTooltip />} />
          <Bar dataKey="value" name={t('sites.stockValue')} fill={c.primary} radius={[0, 4, 4, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ConsumptionChart({ data }: { data: DashboardData['consumptionTrend'] }) {
  const { t } = useTranslation()
  const c = useChartPalette()
  const gradientId = React.useId()
  return (
    <div className="h-64" role="img" aria-label={t('dashboard.consumption')}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.primaryFill} stopOpacity={0.28} />
              <stop offset="100%" stopColor={c.primaryFill} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="month" {...axisProps(c)} tickFormatter={formatMonth} />
          <YAxis {...axisProps(c)} width={64} tickFormatter={(v: number) => formatINRCompact(v)} />
          <Tooltip cursor={{ stroke: c.axis, strokeDasharray: '3 3' }} content={<ChartTooltip labelFormatter={formatMonth} />} />
          <Area
            type="monotone"
            dataKey="value"
            name={t('dashboard.issued')}
            stroke={c.primary}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryDonut({ data }: { data: DashboardData['categoryDistribution'] }) {
  const { t } = useTranslation()
  const c = useChartPalette()
  const max = dashboardConfig.limits.categorySlices
  const slices = React.useMemo(() => {
    const top = data.slice(0, max).map((d, i) => ({ name: t(`categories.${d.category}`), value: d.value, color: c.categorical[i] }))
    const rest = data.slice(max).reduce((s, d) => s + d.value, 0)
    return rest > 0 ? [...top, { name: t('common.other'), value: rest, color: c.other }] : top
  }, [data, t, c, max])
  const total = slices.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
      <div className="relative h-48 w-48 shrink-0" role="img" aria-label={t('dashboard.categoryMix')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={1.5} stroke={c.surface} strokeWidth={2}>
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{t('common.total')}</span>
          <span className="tabular text-lg font-semibold">{formatINRCompact(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="tabular text-muted-foreground">{Math.round((s.value / (total || 1)) * 100)}%</span>
            <span className="tabular w-20 text-right font-medium">{formatINRCompact(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GroupedBarChart({
  data,
  label1,
  label2,
  valueFormatter,
  height = 240,
}: {
  data: { label: string; value: number; value2?: number }[]
  label1: string
  label2?: string
  valueFormatter?: (v: number) => string
  height?: number
}) {
  const c = useChartPalette()
  const hasSecond = data.some((d) => d.value2 !== undefined)
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" {...axisProps(c)} interval={0} tickFormatter={truncate(14)} />
          <YAxis {...axisProps(c)} width={56} tickFormatter={(v: number) => (valueFormatter ? valueFormatter(v) : String(v))} />
          <Tooltip cursor={{ fill: c.grid, fillOpacity: 0.4 }} content={<ChartTooltip valueFormatter={valueFormatter ?? ((v) => String(v))} />} />
          {hasSecond && <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />}
          <Bar dataKey="value" name={label1} fill={hasSecond ? c.categorical[0] : c.primary} radius={[4, 4, 0, 0]} maxBarSize={44} />
          {hasSecond && <Bar dataKey="value2" name={label2} fill={c.categorical[1]} radius={[4, 4, 0, 0]} maxBarSize={44} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
