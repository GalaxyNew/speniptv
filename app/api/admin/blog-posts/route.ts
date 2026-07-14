import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale')
  const deletedOnly = searchParams.get('deleted') === 'true'

  // Recycle bin query requires recycle-bin access (only admin)
  if (deletedOnly) {
    const permission = await verifyPermission('recycle-bin', 'readonly')
    if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })
  } else {
    const permission = await verifyPermission('blog-posts', 'readonly')
    if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })
  }

  const now = new Date()
  // Auto-publish past scheduled posts
  await db.blogPost.updateMany({
    where: { status: 'scheduled', publishAt: { lte: now } },
    data: { status: 'published' }
  })

  const posts = await db.blogPost.findMany({
    where: {
      isDeleted: deletedOnly,
      ...(locale ? { locale } : {}),
    },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const permission = await verifyPermission('blog-posts', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const data = await req.json()
  const {
    title,
    slug,
    locale,
    content,
    category,
    status = 'published',
    publishAt,
    metaTitle = '',
    metaDescription = '',
    canonicalUrl = '',
    robots = 'index, follow',
    keywords = '',
    templateId = null,
    anchorNavEnabled = true,
  } = data

  if (!title || !slug || !locale || !category || content === undefined) {
    return NextResponse.json({ error: 'title, slug, locale, category and content are required' }, { status: 400 })
  }

  // Format slug to lowercase, alphanumeric and dashes only
  const formattedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')

  // Check unique constraint
  const existing = await db.blogPost.findUnique({
    where: {
      locale_slug: {
        locale,
        slug: formattedSlug,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: `Blog post with slug "${formattedSlug}" already exists for locale "${locale}"` }, { status: 400 })
  }

  const parsedPublishAt = publishAt ? new Date(publishAt) : new Date()

  const post = await db.blogPost.create({
    data: {
      title,
      slug: formattedSlug,
      locale,
      content,
      category,
      status,
      publishAt: parsedPublishAt,
      metaTitle,
      metaDescription,
      canonicalUrl,
      robots,
      keywords,
      ...(templateId && { template: { connect: { id: templateId } } }),
      anchorNavEnabled,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
