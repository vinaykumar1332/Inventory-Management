import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileUp, PackageCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button, Dialog, DialogContent } from '@/components/ui'
import { StockMovementSheet, type StockActionMode } from './StockMovementSheet'

export type { StockActionMode }

export interface StockActionDefaults {
  siteId?: string
  productId?: string
  batchId?: string
}

interface StockActionsContextValue {
  open: (mode: StockActionMode | 'receive', defaults?: StockActionDefaults) => void
}

const StockActionsContext = React.createContext<StockActionsContextValue | null>(null)

/**
 * Lets any screen (dashboard quick actions, inventory rows, product drawer,
 * alerts) open the shared stock movement sheets.
 */
export function StockActionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ mode: StockActionMode; defaults: StockActionDefaults; key: number } | null>(null)
  const [receiveOpen, setReceiveOpen] = React.useState(false)

  const value = React.useMemo<StockActionsContextValue>(
    () => ({
      open: (mode, defaults = {}) => {
        if (mode === 'receive') setReceiveOpen(true)
        else setState({ mode, defaults, key: Date.now() })
      },
    }),
    [],
  )

  return (
    <StockActionsContext.Provider value={value}>
      {children}
      {state && (
        <StockMovementSheet
          key={state.key}
          mode={state.mode}
          defaults={state.defaults}
          onClose={() => setState(null)}
        />
      )}
      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} />
    </StockActionsContext.Provider>
  )
}

export function useStockActions() {
  const ctx = React.useContext(StockActionsContext)
  if (!ctx) throw new Error('useStockActions must be used inside StockActionsProvider')
  return ctx
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
                navigate('/upload')
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
