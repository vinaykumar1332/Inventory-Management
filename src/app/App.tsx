import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { Toaster } from 'sonner'
import { appConfig } from '@/config'
import { AuthProvider, SESSION_EXPIRED_EVENT } from '@/features/auth/AuthProvider'
import { ApiError } from '@/services/mockApi'
import { PwaUpdatePrompt } from '@/pwa/pwa'
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider'
import { TooltipProvider } from '@/components/ui'
import { router } from './router'

const onApiError = (error: unknown) => {
  if (error instanceof ApiError && error.key === 'errors.sessionExpired') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
  defaultOptions: {
    queries: { staleTime: appConfig.ui.queryStaleTimeMs, retry: 1, refetchOnWindowFocus: false },
  },
})

function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster position="top-center" theme={resolved} richColors closeButton toastOptions={{ duration: appConfig.ui.toastDurationMs }} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {/* reducedMotion="user" respects prefers-reduced-motion */}
          <MotionConfig reducedMotion="user">
            <LazyMotion features={domAnimation} strict>
              <TooltipProvider delayDuration={300}>
                <RouterProvider router={router} />
                <ThemedToaster />
                <PwaUpdatePrompt />
              </TooltipProvider>
            </LazyMotion>
          </MotionConfig>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
