import * as React from 'react'
import { PageHeader } from './PageHeader'
import { cn } from '@/lib/utils'
import { layoutConfig } from '@/config'
import styles from './PageLayout.module.css'

type AsideWidth = 'sm' | 'md' | 'lg'

/** Optional secondary column for filters or summaries. Stacks below content on phones. */
export function Aside({ children, className, width = layoutConfig.aside.width }: { children: React.ReactNode; className?: string; width?: AsideWidth }) {
  return <aside className={cn(styles.aside, styles[`aside_${width}`], className)}>{children}</aside>
}

/**
 * Standard page frame: header (title, subtitle, actions), an optional toolbar row,
 * the content, and an optional aside. Pages should use this instead of their own header.
 */
export function PageLayout({
  title,
  subtitle,
  actions,
  toolbar,
  aside,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  toolbar?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={styles.page}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={cn(styles.body, aside && styles.withAside)}>
        <div className={styles.content}>{children}</div>
        {aside}
      </div>
    </div>
  )
}
