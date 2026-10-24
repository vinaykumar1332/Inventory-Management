import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileUp, PackageCheck } from 'lucide-react'
import { paths } from '@/app/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, Dialog, DialogContent } from '@/components/ui'
import { StockMovementSheet, type StockActionMode } from './StockMovementSheet'

export type { StockActionMode }

export interface StockActionDefaults {
  siteId?: string
  productId?: string
  batchId?: string
}

interface StockSheetRequest {
  mode: StockActionMode
  defaults: StockActionDefaults
  key: number
}

interface StockActionsStore {
  request: StockSheetRequest | null
  receiveOpen: boolean
  listeners: Set<() => void>
}

// The store lives on globalThis rather than in a React context. A context object is
// recreated on every hot reload, which made screens lose their provider in development.
const STORE_KEY = '__siteseal_stock_actions__'
const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: StockActionsStore }
const store: StockActionsStore = (globalStore[STORE_KEY] ??= { request: null, receiveOpen: false, listeners: new Set() })

function notify() {
  store.listeners.forEach((listener) => listener())
}

const stockActions = {
  open(mode: StockActionMode | 'receive', defaults: StockActionDefaults = {}) {
    if (mode === 'receive') store.receiveOpen = true
    else store.request = { mode, defaults, key: Date.now() }
    notify()
  },
  closeSheet() {
    store.request = null
    notify()
  },
  setReceiveOpen(open: boolean) {
    store.receiveOpen = open
    notify()
  },
  subscribe(listener: () => void) {
    store.listeners.add(listener)
    return () => {
      store.listeners.delete(listener)
    }
  },
  snapshot: () => store,
}

/** Opens the shared stock sheets from any screen: dashboard, inventory rows, product drawer, site detail. */
export function useStockActions() {
  return { open: stockActions.open }
}

/** Renders the shared stock sheets once, near the top of the app. Wrap the layout with it. */
export function StockActionsHost({ children }: { children: React.ReactNode }) {
  const state = React.useSyncExternalStore(stockActions.subscribe, stockActions.snapshot, stockActions.snapshot)
  return (
    <>
      {children}
      {state.request && (
        <StockMovementSheet
          key={state.request.key}
          mode={state.request.mode}
          defaults={state.request.defaults}
          onClose={stockActions.closeSheet}
        />
      )}
      <ReceiveDialog open={state.receiveOpen} onOpenChange={stockActions.setReceiveOpen} />
    </>
  )
}

function ReceiveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useAuth()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t('stock.receiveTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!can('upload_bills')}
              onClick={() => {
                onOpenChange(false)
                navigate(paths.upload())
              }}
            >
              <FileUp /> {t('stock.receiveGo')}
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <PackageCheck className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">{t('stock.receiveHint')}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
