import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyApiAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const templates = await db.blogTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        isDefault: true,
        anchorNavEnabled: true,
        recommendationsType: true,
        recommendationsCount: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      ok: true,
      templates,
    })
  } catch (err: any) {
    console.error('API Templates GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch templates', details: err.message }, { status: 500 })
  }
}
