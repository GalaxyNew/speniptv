import { NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/edit-mode?to=/  — enter edit mode (Next Draft Mode) then redirect.
export async function GET(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'

  const settings = await db.siteSettings.findFirst()
  let baseUrl = ''
  if (settings?.siteDomain && settings.siteDomain.trim() !== '' && settings.siteDomain !== 'https://example.com') {
    baseUrl = settings.siteDomain.replace(/\/$/, '')
  } else if (host) {
    baseUrl = `${proto}://${host}`
  } else {
    try {
      const parsedUrl = new URL(req.url)
      baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`
    } catch {
      baseUrl = 'http://localhost:3000'
    }
  }

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', baseUrl))
  }

  const dm = await draftMode()
  dm.enable()

  const { searchParams } = new URL(req.url)
  const to = searchParams.get('to') || '/'
  // Only allow same-origin relative paths to avoid open-redirects
  const safeTo = to.startsWith('/') && !to.startsWith('//') ? to : '/'
  return NextResponse.redirect(new URL(safeTo, baseUrl))
}

// DELETE /api/admin/edit-mode — exit edit mode
export async function DELETE() {
  const dm = await draftMode()
  dm.disable()
  return NextResponse.json({ ok: true })
}
