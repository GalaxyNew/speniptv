import { db } from '@/lib/db'
import { headers } from 'next/headers'

/**
 * Saves an administrative action log to the database.
 * 
 * @param operator Username of the admin performing the action
 * @param action Action type (e.g. LOGIN_SUCCESS, CREATE_ACCOUNT)
 * @param target Optional target affected by the action (e.g. username of target account)
 * @param details Optional additional text details or JSON configuration
 * @param customIp Optional client IP override
 */
export async function logAction(
  operator: string,
  action: string,
  target?: string | null,
  details?: string | null,
  customIp?: string
) {
  let ip = customIp || ''
  if (!customIp) {
    try {
      const headersList = await headers()
      ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
           headersList.get('x-real-ip') ||
           headersList.get('cf-connecting-ip') ||
           '127.0.0.1'
    } catch (e) {
      // Fallback if called outside request context
    }
  }

  try {
    await db.auditLog.create({
      data: {
        operator,
        action,
        target: target || null,
        details: details || null,
        ip,
      },
    })
  } catch (e) {
    console.error('Failed to save audit log:', e)
  }
}
