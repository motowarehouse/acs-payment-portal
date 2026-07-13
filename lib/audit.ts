import { prisma } from './prisma'

export type AuditAction =
  | 'STATUS_CHANGE'
  | 'PAYMENT_ADD'
  | 'PAYMENT_DELETE'
  | 'CHEQUE_STATUS'
  | 'IMPORT_UNDO'
  | 'NOTES_EDIT'

/**
 * Record an audit entry. Never throws — an audit failure must not
 * break the underlying action.
 */
export async function audit(entry: {
  user?: string | null
  action: AuditAction
  trackingNumber?: string | null
  detail?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user: entry.user ?? null,
        action: entry.action,
        trackingNumber: entry.trackingNumber ?? null,
        detail: entry.detail ?? null,
      },
    })
  } catch (e) {
    console.error('audit log write failed', e)
  }
}
