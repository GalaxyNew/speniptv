import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

export async function GET(req: Request) {
  const permission = await verifyPermission('blog-templates', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const templates = await db.blogTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(templates)
}

export async function POST(req: Request) {
  const permission = await verifyPermission('blog-templates', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const data = await req.json()
  const {
    name,
    headerContent = '',
    footerContent = '',
    anchorNavEnabled = true,
    recommendationsType = 'latest',
    recommendationsCount = 3,
    keywordLinks = '',
    isDefault = false,
  } = data

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (Boolean(isDefault)) {
    await db.blogTemplate.updateMany({
      data: { isDefault: false }
    })
  }

  const template = await db.blogTemplate.create({
    data: {
      name,
      headerContent,
      footerContent,
      anchorNavEnabled: Boolean(anchorNavEnabled),
      recommendationsType,
      recommendationsCount: Number(recommendationsCount),
      keywordLinks,
      isDefault: Boolean(isDefault),
    },
  })
  return NextResponse.json(template, { status: 201 })
}
