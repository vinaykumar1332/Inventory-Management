import { readStorage, removeStorage, storageKeys, writeStorage } from '@/lib/storage'

// Simulates the bearer token a real API client would attach to requests.
// NOT secure: a production app must use httpOnly cookies / short-lived tokens.

interface Session {
  userId: string
}

export function getSession(): Session | null {
  return readStorage<Session | null>(storageKeys.session, null)
}

export function setSession(userId: string) {
  writeStorage(storageKeys.session, { userId })
}

export function clearSession() {
  removeStorage(storageKeys.session)
}
