import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

interface Params { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const permission = await verifyPermission('blog-posts', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const post = await db.blogPost.findUnique({
    where: { id },
    include: { template: true },
  })
  
  if (!post) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const data = await req.json()
  
  const permission = await verifyPermission('blog-posts', 'edit')
  let isAuthorized = permission.authorized
  
  if (!isAuthorized && data.isDeleted === false) {
    const recyclePermission = await verifyPermission('recycle-bin', 'edit')
    isAuthorized = recyclePermission.authorized
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const {
    title,
    slug,
    locale,
    content,
    category,
    status,
    publishAt,
    metaTitle,
    metaDescription,
    canonicalUrl,
    robots,
    keywords,
    templateId,
    anchorNavEnabled,
  } = data

  const current = await db.blogPost.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
  }

  let formattedSlug = current.slug
  if (slug !== undefined) {
    formattedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
  }

  const targetLocale = locale !== undefined ? locale : current.locale

  // Check unique constraint if slug or locale changed
  if (formattedSlug !== current.slug || targetLocale !== current.locale) {
    const existing = await db.blogPost.findUnique({
      where: {
        locale_slug: {
          locale: targetLocale,
          slug: formattedSlug,
        },
      },
    })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Blog post with slug "${formattedSlug}" already exists for locale "${targetLocale}"` }, { status: 400 })
    }
  }

  const updated = await db.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug: formattedSlug }),
      ...(locale !== undefined && { locale }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(status !== undefined && { status }),
      ...(publishAt !== undefined && { publishAt: new Date(publishAt) }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(canonicalUrl !== undefined && { canonicalUrl }),
      ...(robots !== undefined && { robots }),
      ...(keywords !== undefined && { keywords }),
      ...(templateId !== undefined && {
        template: templateId ? { connect: { id: templateId } } : { disconnect: true }
      }),
      ...(anchorNavEnabled !== undefined && { anchorNavEnabled }),
      ...(data.isDeleted !== undefined && { isDeleted: Boolean(data.isDeleted) }),
      ...(data.isDeleted !== undefined && { deletedAt: data.isDeleted ? new Date() : null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: Params) {
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get('permanent') === 'true'

  if (permanent) {
    const permission = await verifyPermission('recycle-bin', 'edit')
    if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })
  } else {
    const permission = await verifyPermission('blog-posts', 'edit')
    if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })
  }

  const { id } = await params
  const current = await db.blogPost.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
  }

  if (permanent) {
    await db.blogPost.delete({ where: { id } })
  } else {
    await db.blogPost.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })
  }
  return NextResponse.json({ ok: true })
}
