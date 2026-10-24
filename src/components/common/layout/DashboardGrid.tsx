import * as React from 'react'
import { layoutConfig } from '@/config'
import styles from './DashboardGrid.module.css'

/**
 * Lays out dashboard widgets in the rows defined in layout.json (dashboard.rows).
 * Each widget takes `dashboard.spans[id]` columns (default 1) and a row shares its
 * width between the sum of those spans from the lg breakpoint up. Phones stack everything.
 * Widgets missing from the config are not shown, so layout changes need no code change.
 */
export function DashboardGrid({ widgets }: { widgets: Record<string, React.ReactNode | null | undefined | false> }) {
  const spans = layoutConfig.dashboard.spans ?? {}
  return (
    <div className={styles.grid}>
      {layoutConfig.dashboard.rows.map((row, index) => {
        const visible = row.filter((id) => widgets[id])
        if (visible.length === 0) return null
        const units = visible.reduce((sum, id) => sum + (spans[id] ?? 1), 0)
        return (
          <div key={index} className={styles.row} style={{ '--row-units': units } as React.CSSProperties}>
            {visible.map((id) => (
              <div key={id} className={styles.cell} data-span={spans[id] ?? 1}>
                {widgets[id]}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
