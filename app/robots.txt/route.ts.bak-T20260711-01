import { db } from '@/lib/db'

export async function GET(request: Request) {
  const settings = await db.siteSettings.findUnique({ where: { id: 'main' } })
  const text = settings?.robotsTxt || "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/"
  
  const url = new URL(request.url)
  const host = request.headers.get('host') || url.host
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const domain = settings?.siteDomain && settings.siteDomain !== 'https://example.com'
    ? settings.siteDomain
    : `${protocol}://${host}`
    
  const sitemapUrl = `${domain}/sitemap.xml`

  // Legal / policy pages are intentionally left crawlable: they carry a
  // `noindex, nofollow` meta tag (set on the Subpage records), and a page must
  // be crawlable for Google to actually read that tag. Blocking them in
  // robots.txt would hide the noindex and risk a URL-only "indexed without
  // content" listing instead. The generic "User-agent: *" group already covers
  // /admin/ and /api/, so no Googlebot-specific group is needed.
  const body = `${text}\n\nSitemap: ${sitemapUrl}`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
