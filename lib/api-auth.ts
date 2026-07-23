import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Helper to verify API authentication.
 * Supports:
 * 1. `X-API-Key` HTTP Header
 * 2. `Authorization: Bearer <KEY>` HTTP Header
 * 3. Session Authentication (if called from admin UI)
 */
export async function verifyApiAuth(req: Request) {
  const apiKeyHeader = req.headers.get('x-api-key')
  const authHeader = req.headers.get('authorization')

  let providedKey: string | null = null

  if (apiKeyHeader) {
    providedKey = apiKeyHeader.trim()
  } else if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    providedKey = authHeader.slice(7).trim()
  }

  if (providedKey) {
    // 1. Check SiteSettings configured apiKey in database
    let configuredApiKey: string | null = null
    try {
      const settings = await db.siteSettings.findUnique({
        where: { id: 'main' },
        select: { apiKey: true }
      })
      if (settings?.apiKey && settings.apiKey.trim() !== '') {
        configuredApiKey = settings.apiKey.trim()
      }
    } catch (e) {
      console.error('Failed to read SiteSettings apiKey:', e)
    }

    // 2. Fallback to process.env.API_SECRET_KEY or default
    const validKeys = [
      configuredApiKey,
      process.env.API_SECRET_KEY,
      'igortv-api-secret-key-2026',
    ].filter(Boolean) as string[]

    if (validKeys.includes(providedKey)) {
      return { authorized: true, operator: 'api_user' }
    }
    return { authorized: false, error: 'Invalid API Key', status: 401 }
  }

  // Fallback to NextAuth session validation
  const session = await getServerSession(authOptions)
  if (session && session.user) {
    return { authorized: true, operator: session.user.name || 'admin' }
  }

  return {
    authorized: false,
    error: 'Unauthorized: Missing or invalid API key in header (X-API-Key or Authorization: Bearer <KEY>)',
    status: 401,
  }
}
