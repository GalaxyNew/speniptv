import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

interface Params { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const permission = await verifyPermission('subpages', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const subpage = await db.subpage.findUnique({
    where: { id }
  })
  
  if (!subpage) {
    return NextResponse.json({ error: 'Subpage not found' }, { status: 404 })
  }
  return NextResponse.json(subpage)
}

export async function PATCH(req: Request, { params }: Params) {
  const permission = await verifyPermission('subpages', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const data = await req.json()
  const {
    title,
    slug,
    locale,
    content,
    isVisible,
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots,
  } = data

  const current = await db.subpage.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Subpage not found' }, { status: 404 })
  }

  let formattedSlug = current.slug
  if (slug !== undefined) {
    formattedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
  }

  const targetLocale = locale !== undefined ? locale : current.locale

  // Check unique constraint if slug or locale changed
  if (formattedSlug !== current.slug || targetLocale !== current.locale) {
    const existing = await db.subpage.findUnique({
      where: {
        locale_slug: {
          locale: targetLocale,
          slug: formattedSlug,
        },
      },
    })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Subpage with slug "${formattedSlug}" already exists for locale "${targetLocale}"` }, { status: 400 })
    }
  }

  const updated = await db.subpage.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug: formattedSlug }),
      ...(locale !== undefined && { locale }),
      ...(content !== undefined && { content }),
      ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(canonicalUrl !== undefined && { canonicalUrl }),
      ...(robots !== undefined && { robots }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: Params) {
  const permission = await verifyPermission('subpages', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const current = await db.subpage.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Subpage not found' }, { status: 404 })
  }

  await db.subpage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
