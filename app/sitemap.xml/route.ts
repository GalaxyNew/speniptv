import { db } from '@/lib/db'

// Must be dynamic: a build-time static sitemap would never pick up newly
// published blog posts or subpages. CDN caching is handled via Cache-Control.
export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()

  // Auto-publish past scheduled posts
  await db.blogPost.updateMany({
    where: { status: 'scheduled', publishAt: { lte: now } },
    data: { status: 'published' }
  })

  const [settings, subpages, blogPosts] = await Promise.all([
    db.siteSettings.findFirst(),
    db.subpage.findMany({
      where: { locale: 'es', isVisible: true },
      select: { slug: true, robots: true, updatedAt: true }
    }),
    db.blogPost.findMany({
      where: {
        locale: 'es',
        isDeleted: false,
        OR: [
          { status: 'published' },
          { status: 'scheduled', publishAt: { lte: now } }
        ]
      },
      select: { slug: true, robots: true, updatedAt: true },
      orderBy: { publishAt: 'desc' }
    })
  ])

  const rawDomain = settings?.siteDomain && settings.siteDomain !== 'https://example.com'
    ? settings.siteDomain
    : 'https://igoriptv2.com'
  const domain = rawDomain.replace(/\/$/, '')

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const isIndexable = (robots?: string | null) => !robots || !robots.toLowerCase().includes('noindex')

  const indexableBlogPosts = blogPosts.filter((p) => isIndexable(p.robots))

  // Blog index freshness follows its newest post
  const latestPostDate = indexableBlogPosts.reduce<Date | null>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    null
  )

  const urls: string[] = []

  // 1. Homepage (ES root, prefix-free)
  urls.push(`  <url>
    <loc>${domain}/</loc>
    <lastmod>${fmt(now)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`)

  // 2. Blog index (ES prefix-free)
  urls.push(`  <url>
    <loc>${domain}/blog</loc>
    <lastmod>${fmt(latestPostDate ?? now)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`)

  // 3. Subpages — skip noindexed pages (legal/policy pages are noindex)
  for (const page of subpages) {
    if (page.slug === 'home' || page.slug === 'blog') continue
    if (!isIndexable(page.robots)) continue
    urls.push(`  <url>
    <loc>${domain}/${page.slug}</loc>
    <lastmod>${fmt(page.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
  }

  // 4. Blog posts
  for (const post of indexableBlogPosts) {
    urls.push(`  <url>
    <loc>${domain}/blog/${post.slug}</loc>
    <lastmod>${fmt(post.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    },
  })
}
