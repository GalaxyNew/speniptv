import { db } from '@/lib/db'

/**
 * Saves an administrative action log to the database.
 * 
 * @param operator Username of the admin performing the action
 * @param action Action type (e.g. LOGIN_SUCCESS, CREATE_ACCOUNT)
 * @param target Optional target affected by the action (e.g. username of target account)
 * @param details Optional additional text details or JSON configuration
 */
export async function logAction(
  operator: string,
  action: string,
  target?: string | null,
  details?: string | null
) {
  try {
    await db.auditLog.create({
      data: {
        operator,
        action,
        target: target || null,
        details: details || null,
      },
    })
  } catch (e) {
    console.error('Failed to save audit log:', e)
  }
}
