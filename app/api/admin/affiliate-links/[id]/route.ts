import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const permission = await verifyPermission('affiliate-links', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const data = await req.json()
  const { title, subtitle, url, locale, sortOrder, isActive } = data

  const updated = await db.affiliateLink.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(url !== undefined && { url }),
      ...(locale !== undefined && { locale }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: Params) {
  const permission = await verifyPermission('affiliate-links', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  await db.affiliateLink.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
