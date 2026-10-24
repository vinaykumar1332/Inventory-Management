import type { DemoDb } from '@/data'
import { uid } from '@/lib/utils'
import { nowIso } from '@/utils/date'

/** Appends an entry to the audit log (newest first). */
export function audit(
  db: DemoDb,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details: string,
  approvalId: string | null = null,
) {
  db.auditLogs.unshift({ id: uid('a'), at: nowIso(), userId, action, entity, entityId, details, approvalId })
}
