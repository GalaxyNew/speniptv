import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyApiAuth } from '@/lib/api-auth'

const VALID_CATEGORIES = ['guias', 'dispositivos', 'contenido', 'comparativas']
const VALID_STATUSES = ['published', 'draft', 'scheduled']

// Slug generator helper
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`
}

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const locale = searchParams.get('locale') || undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const skip = (page - 1) * limit

    const where = {
      isDeleted: false,
      ...(locale ? { locale } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    }

    const [total, posts] = await Promise.all([
      db.blogPost.count({ where }),
      db.blogPost.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    return NextResponse.json({
      ok: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      posts,
    })
  } catch (err: any) {
    console.error('API Posts GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch posts', details: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const {
      title,
      content,
      category = 'guias',
      slug: customSlug,
      locale = 'es',
      status = 'published',
      publishAt,
      templateId,
      templateName,
      excerpt = '',
      metaTitle = '',
      metaDescription = '',
      canonicalUrl = '',
      robots = 'index, follow',
      keywords = '',
      anchorNavEnabled = true,
    } = body

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Missing required field: "title"' }, { status: 400 })
    }
    if (content === undefined || content === null) {
      return NextResponse.json({ error: 'Missing required field: "content"' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Format Slug
    const slug = customSlug
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      : generateSlug(title)

    // Check unique constraint for (locale, slug)
    const existing = await db.blogPost.findUnique({
      where: { locale_slug: { locale, slug } },
    })

    if (existing) {
      return NextResponse.json(
        { error: `A blog post with slug "${slug}" already exists for locale "${locale}". Please provide a custom unique slug.` },
        { status: 400 }
      )
    }

    // Parse publishAt
    let parsedPublishAt = new Date()
    if (publishAt) {
      const d = new Date(publishAt)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid "publishAt" date timestamp format' }, { status: 400 })
      }
      parsedPublishAt = d
    } else if (status === 'scheduled') {
      return NextResponse.json({ error: 'Field "publishAt" is required when status is "scheduled"' }, { status: 400 })
    }

    // Resolve template ID if templateName provided
    let targetTemplateId: string | null = templateId || null
    if (!targetTemplateId && templateName) {
      const t = await db.blogTemplate.findFirst({
        where: { name: { contains: templateName } },
      })
      if (t) targetTemplateId = t.id
    }

    // Format keywords string
    const formattedKeywords = Array.isArray(keywords) ? keywords.join(', ') : keywords

    const post = await db.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        locale,
        content: typeof content === 'string' ? content : String(content),
        excerpt: excerpt || '',
        category,
        status,
        publishAt: parsedPublishAt,
        metaTitle: metaTitle || title.trim(),
        metaDescription: metaDescription || excerpt || '',
        canonicalUrl: canonicalUrl || '',
        robots: robots || 'index, follow',
        keywords: formattedKeywords || '',
        anchorNavEnabled: Boolean(anchorNavEnabled),
        ...(targetTemplateId ? { template: { connect: { id: targetTemplateId } } } : {}),
      },
      include: {
        template: { select: { id: true, name: true } },
      },
    })

    // Construct view URL
    const host = req.headers.get('host')
    const protocol = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    const publicUrlPath = `/${locale}/blog/${post.slug}`
    const absolutePublicUrl = host ? `${protocol}://${host}${publicUrlPath}` : publicUrlPath

    return NextResponse.json(
      {
        ok: true,
        message: status === 'scheduled' ? 'Article scheduled successfully' : 'Article published successfully',
        post,
        url: publicUrlPath,
        absoluteUrl: absolutePublicUrl,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('API Post Create error:', err)
    return NextResponse.json({ error: 'Failed to create blog post', details: err.message }, { status: 500 })
  }
}
