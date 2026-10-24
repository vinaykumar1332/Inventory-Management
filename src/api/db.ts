import { loadMockDb, type DemoDb } from '@/data'
import { snapshotFor } from '@/features/approvals/engine'

// In-browser demo database built from src/data/mock/*.json. It lives in memory only,
// so a page reload restores the mock data. Replace with real API calls later.

let db: DemoDb | null = null

export function getDb(): DemoDb {
  if (!db) {
    db = loadMockDb()
    for (const approval of db.approvals) {
      if (approval.snapshot === null && approval.status === 'pending') {
        approval.snapshot = snapshotFor(db, approval.action, approval.payload)
      }
    }
  }
  return db
}

export function resetDb() {
  db = null
}
