import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'

export { TabsContent }

export interface TabItem<T extends string = string> {
  value: T
  label: React.ReactNode
  /** Numeric badge shown after label */
  count?: number
}

interface PageTabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: TabItem<T>[]
  /** Extra classes applied to the TabsList wrapper */
  listClassName?: string
  children: React.ReactNode
}

/**
 * Shared page-level tab navigation. Wraps Radix Tabs with a consistent
 * declarative API so every page gets the same look and behaviour.
 *
 * Usage:
 *   <PageTabs value={tab} onChange={setTab} tabs={[{value:'a', label:'A'}]}>
 *     <TabsContent value="a">…</TabsContent>
 *   </PageTabs>
 */
export function PageTabs<T extends string>({ value, onChange, tabs, listClassName, children }: PageTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={onChange as (v: string) => void}>
      <TabsList className={cn('mb-5', listClassName)}>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
            {t.count !== undefined && (
              <span className="tabular text-xs text-muted-foreground">{t.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}
