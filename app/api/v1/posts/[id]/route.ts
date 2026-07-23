import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyApiAuth } from '@/lib/api-auth'

interface Params {
  params: Promise<{ id: string }>
}

const VALID_CATEGORIES = ['guias', 'dispositivos', 'contenido', 'comparativas']
const VALID_STATUSES = ['published', 'draft', 'scheduled']

export async function GET(req: Request, { params }: Params) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const post = await db.blogPost.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: { template: true },
    })

    if (!post || post.isDeleted) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, post })
  } catch (err: any) {
    console.error('API Post GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch article', details: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const body = await req.json()

    const current = await db.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!current || current.isDeleted) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const {
      title,
      content,
      category,
      slug: customSlug,
      locale,
      status,
      publishAt,
      templateId,
      templateName,
      excerpt,
      metaTitle,
      metaDescription,
      canonicalUrl,
      robots,
      keywords,
      anchorNavEnabled,
    } = body

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    let formattedSlug = current.slug
    if (customSlug !== undefined) {
      formattedSlug = customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
    }
    const targetLocale = locale !== undefined ? locale : current.locale

    if (formattedSlug !== current.slug || targetLocale !== current.locale) {
      const existing = await db.blogPost.findUnique({
        where: { locale_slug: { locale: targetLocale, slug: formattedSlug } },
      })
      if (existing && existing.id !== current.id) {
        return NextResponse.json(
          { error: `A post with slug "${formattedSlug}" already exists for locale "${targetLocale}"` },
          { status: 400 }
        )
      }
    }

    let targetTemplateId = templateId
    if (targetTemplateId === undefined && templateName) {
      const t = await db.blogTemplate.findFirst({
        where: { name: { contains: templateName } },
      })
      if (t) targetTemplateId = t.id
    }

    const updated = await db.blogPost.update({
      where: { id: current.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(category !== undefined && { category }),
        ...(customSlug !== undefined && { slug: formattedSlug }),
        ...(locale !== undefined && { locale }),
        ...(status !== undefined && { status }),
        ...(publishAt !== undefined && { publishAt: new Date(publishAt) }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(robots !== undefined && { robots }),
        ...(keywords !== undefined && {
          keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
        }),
        ...(anchorNavEnabled !== undefined && { anchorNavEnabled: Boolean(anchorNavEnabled) }),
        ...(targetTemplateId !== undefined && {
          template: targetTemplateId ? { connect: { id: targetTemplateId } } : { disconnect: true },
        }),
      },
      include: { template: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ ok: true, message: 'Article updated successfully', post: updated })
  } catch (err: any) {
    console.error('API Post PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update article', details: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'

    const current = await db.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!current) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (permanent) {
      await db.blogPost.delete({ where: { id: current.id } })
    } else {
      await db.blogPost.update({
        where: { id: current.id },
        data: { isDeleted: true, deletedAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true, message: permanent ? 'Article deleted permanently' : 'Article moved to recycle bin' })
  } catch (err: any) {
    console.error('API Post DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete article', details: err.message }, { status: 500 })
  }
}
