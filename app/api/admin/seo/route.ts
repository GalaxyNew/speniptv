import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

// GET /api/admin/seo?locale=fr
export async function GET(req: Request) {
  const permission = await verifyPermission('seo', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale')

  if (locale) {
    const seo = await db.pageSeo.findUnique({ where: { locale } })
    return NextResponse.json(seo)
  }

  const all = await db.pageSeo.findMany()
  return NextResponse.json(all)
}

// PATCH /api/admin/seo
export async function PATCH(req: Request) {
  const permission = await verifyPermission('seo', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { locale, ...data } = await req.json()
  if (!locale) return NextResponse.json({ error: 'Missing locale' }, { status: 400 })

  const result = await db.pageSeo.upsert({
    where: { locale },
    update: data,
    create: { locale, ...data },
  })
  return NextResponse.json({ ok: true, data: result })
}
