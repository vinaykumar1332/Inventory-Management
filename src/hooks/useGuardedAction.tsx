import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useNetworkState } from '@/features/pwa'
import { ConfirmDialog } from '@/components/ui'

/**
 * Common control for actions that send data (uploads, submits):
 * - a second click while the action runs is ignored
 * - offline: the action is blocked with a message
 * - slow connection: the user confirms before the action starts
 * - online: runs immediately, with no warning
 * Render `guard.dialog` once in the component's JSX.
 */
export function useGuardedAction<A extends unknown[]>(action: (...args: A) => Promise<unknown>) {
  const { t } = useTranslation()
  const network = useNetworkState()
  const running = React.useRef(false)
  const [pending, setPending] = React.useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = React.useState<A | null>(null)

  const execute = async (args: A) => {
    if (running.current) return
    running.current = true
    setPending(true)
    try {
      await action(...args)
    } finally {
      running.current = false
      setPending(false)
    }
  }

  const run = (...args: A) => {
    if (running.current) return
    if (network === 'offline') {
      toast.error(t('network.offlineToast'))
      return
    }
    if (network === 'slow') {
      setAwaitingConfirm(args)
      return
    }
    void execute(args)
  }

  const dialog = (
    <ConfirmDialog
      open={awaitingConfirm !== null}
      onOpenChange={(open) => !open && setAwaitingConfirm(null)}
      title={t('network.slowConfirmTitle')}
      description={t('network.slowConfirmBody')}
      confirmLabel={t('network.slowConfirmAction')}
      tone="warning"
      onConfirm={() => {
        const args = awaitingConfirm
        setAwaitingConfirm(null)
        if (args) void execute(args)
      }}
    />
  )

  return { run, pending, dialog }
}
