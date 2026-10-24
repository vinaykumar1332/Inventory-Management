import * as React from 'react'
import { Sheet } from '@/components/ui'
import { uiConfig } from '@/config'

export type PanelWidth = 'sm' | 'md' | 'lg'

const SHEET_SIZE: Record<PanelWidth, 'md' | 'lg' | 'xl'> = { sm: 'md', md: 'lg', lg: 'xl' }

export interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Width token. Defaults to ui.json sidePanel.defaultWidth. */
  width?: PanelWidth
  footer?: React.ReactNode
  /** When false, Escape and the backdrop do not close the panel; only the footer actions do. */
  dismissible?: boolean
  children: React.ReactNode
}

/**
 * The one panel for details and forms. Opens beside the content on desktop and as a
 * full-height drawer on phones. Replaces the individual sheet layouts used per feature.
 */
export function SidePanel({ open, onClose, title, description, width = uiConfig.sidePanel.defaultWidth, footer, dismissible = true, children }: SidePanelProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && dismissible) onClose()
      }}
      title={title}
      description={description}
      size={SHEET_SIZE[width]}
      footer={footer}
    >
      {children}
    </Sheet>
  )
}
