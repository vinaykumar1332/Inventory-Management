import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@/i18n'

// Testing Library only cleans up automatically when Vitest globals are on, so do it here.
afterEach(() => {
  cleanup()
})
