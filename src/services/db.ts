import { DB_VERSION, loadMockDb, type DemoDb } from '@/data'
import { readStorage, removeStorage, storageKeys, writeStorage } from '@/lib/storage'

// In-browser "database" for the demo, loaded from src/data/mock/*.json and
// persisted to localStorage so edits survive reloads. Replace with real API
// calls later.

let db: DemoDb | null = null

export function getDb(): DemoDb {
  if (!db) {
    const stored = readStorage<DemoDb | null>(storageKeys.db, null)
    db = stored && stored.version === DB_VERSION ? stored : loadMockDb()
  }
  return db
}

/** Persist the current state after a mutation */
export function commit() {
  if (db) writeStorage(storageKeys.db, db)
}

export function resetDb() {
  removeStorage(storageKeys.db)
  db = loadMockDb()
}
