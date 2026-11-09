import * as mockApi from '@/api/mockApi'
import type { CreateUserInput, User } from '@/types'
import type { UserStatusUpdate } from './types'

// Re-export mock functions with explicit names (easier to migrate to real API later)
export const adminApi = {
  // User management
  listUsers: () => mockApi.getUsers(),
  createUser: (input: CreateUserInput) => mockApi.createUser(input),
  updateUser: (id: string, updates: Partial<User>) => mockApi.updateUser(id, updates),
  updateUserStatus: (payload: UserStatusUpdate) => mockApi.updateUser(payload.id, { status: payload.status }),

  // Company info
  getCompany: () => mockApi.getCompany(),

  // Demo data
  resetDemoData: () => mockApi.resetDemoData(),
}

export type { UserStatusUpdate }
