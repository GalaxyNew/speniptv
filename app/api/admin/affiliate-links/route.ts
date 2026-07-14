import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

export async function GET(req: Request) {
  const permission = await verifyPermission('affiliate-links', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale')

  const links = await db.affiliateLink.findMany({
    where: locale ? { locale } : undefined,
    orderBy: [{ locale: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(links)
}

export async function POST(req: Request) {
  const permission = await verifyPermission('affiliate-links', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const data = await req.json()
  const { title, subtitle = '', url, locale, sortOrder = 0, isActive = true } = data

  if (!title || !url || !locale) {
    return NextResponse.json({ error: 'title, url and locale are required' }, { status: 400 })
  }

  const link = await db.affiliateLink.create({
    data: { title, subtitle, url, locale, sortOrder: Number(sortOrder), isActive: Boolean(isActive) },
  })
  return NextResponse.json(link, { status: 201 })
}
