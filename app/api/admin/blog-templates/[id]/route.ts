import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

interface Params { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const permission = await verifyPermission('blog-templates', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const template = await db.blogTemplate.findUnique({
    where: { id }
  })
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
  return NextResponse.json(template)
}

export async function PATCH(req: Request, { params }: Params) {
  const permission = await verifyPermission('blog-templates', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const data = await req.json()
  const {
    name,
    headerContent,
    footerContent,
    anchorNavEnabled,
    recommendationsType,
    recommendationsCount,
    keywordLinks,
    isDefault,
  } = data

  const current = await db.blogTemplate.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (isDefault !== undefined && Boolean(isDefault)) {
    await db.blogTemplate.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false }
    })
  }

  const updated = await db.blogTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(headerContent !== undefined && { headerContent }),
      ...(footerContent !== undefined && { footerContent }),
      ...(anchorNavEnabled !== undefined && { anchorNavEnabled: Boolean(anchorNavEnabled) }),
      ...(recommendationsType !== undefined && { recommendationsType }),
      ...(recommendationsCount !== undefined && { recommendationsCount: Number(recommendationsCount) }),
      ...(keywordLinks !== undefined && { keywordLinks }),
      ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: Params) {
  const permission = await verifyPermission('blog-templates', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const current = await db.blogTemplate.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await db.blogTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
