import { loadMockDb, type DemoDb } from '@/data'

// In-browser demo database built from src/data/mock/*.json. It lives in memory only,
// so a page reload restores the mock data. Replace with real API calls later.

let db: DemoDb | null = null

export function getDb(): DemoDb {
  db ??= loadMockDb()
  return db
}

export function resetDb() {
  db = loadMockDb()
}
