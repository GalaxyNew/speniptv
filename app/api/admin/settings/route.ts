import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

// GET settings
export async function GET() {
  const permission = await verifyPermission('settings', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const settings = await db.siteSettings.findUnique({ where: { id: 'main' } })
  return NextResponse.json(settings)
}

// PATCH update settings
export async function PATCH(req: Request) {
  const permission = await verifyPermission('settings', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const data = await req.json()
  // Remove id from update payload
  const { id: _id, ...updateData } = data

  const result = await db.siteSettings.upsert({
    where: { id: 'main' },
    update: updateData,
    create: { id: 'main', ...updateData },
  })
  return NextResponse.json({ ok: true, data: result })
}
