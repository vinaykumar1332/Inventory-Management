import type { User } from '@/types'

export interface AdminSheetState {
  open: boolean
  user: User | null
}

export interface UserStatusUpdate {
  id: string
  status: 'active' | 'disabled'
}
