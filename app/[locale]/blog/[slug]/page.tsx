import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getMergedSettings, resolveSiteDomain } from '@/lib/settings'
import { publicUrl, publicPath } from '@/lib/seo'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BlogTocSidebar from '@/components/frontend/BlogTocSidebar'

export const revalidate = 60

// Pre-render published posts as ISR pages; unlisted slugs (e.g. a just-scheduled
// post) still render on-demand and get cached, thanks to default dynamicParams.
export async function generateStaticParams() {
  const posts = await db.blogPost.findMany({
    where: { locale: 'es', status: 'published', isDeleted: false },
    select: { slug: true },
  })
  return posts.map((p) => ({ locale: 'es', slug: p.slug }))
}

interface SubpageProps {
  params: Promise<{ locale: string; slug: string }>
}

// ─── Content Processing Helpers ──────────────────────────────────────────────

// Auto-inject keyword hyperlinks safely (avoiding matches inside existing tags)
function injectKeywordLinks(html: string, keywordMap: Record<string, string>): string {
  if (!html || !keywordMap || Object.keys(keywordMap).length === 0) return html

  // Sort keywords by length descending so longer phrases match first
  const keywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length)

  // Split HTML by tags to isolate text segments
  const tokens = html.split(/(<[^>]+>)/g)
  let insideAnchor = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.startsWith('<')) {
      const lowerTag = token.toLowerCase()
      if (lowerTag.startsWith('<a ') || lowerTag === '<a>') {
        insideAnchor++
      } else if (lowerTag === '</a>') {
        insideAnchor = Math.max(0, insideAnchor - 1)
      }
    } else {
      if (insideAnchor === 0 && token.trim().length > 0) {
        let processedText = token
        for (const kw of keywords) {
          const url = keywordMap[kw]
          const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
          const regex = new RegExp(`(${escapedKw})`, 'gi')
          
          processedText = processedText.replace(regex, (match) => {
            return `<a href="${url}" class="keyword-link" style="color:var(--accent-1,#22d3ee);text-decoration:underline;font-weight:600;">${match}</a>`
          })
        }
        tokens[i] = processedText
      }
    }
  }

  return tokens.join('')
}

// Extract headings for Table of Contents and inject dynamic element IDs
interface TocItem {
  id: string
  text: string
  level: number
}

function processAnchorsAndExtractToc(html: string): { processedHtml: string; toc: TocItem[] } {
  const toc: TocItem[] = []
  let headingIndex = 0

  const tokens = html.split(/(<[^>]+>)/g)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.startsWith('<')) {
      const match = token.match(/^<(h2|h3)([^>]*)>$/i)
      if (match) {
        const level = parseInt(match[1])
        const originalAttrs = match[2]
        
        let headingText = ''
        let lookahead = i + 1
        const closingTag = `</${match[1]}>`.toLowerCase()
        while (lookahead < tokens.length && tokens[lookahead].toLowerCase() !== closingTag) {
          headingText += tokens[lookahead]
          lookahead++
        }
        
        const cleanText = headingText.replace(/<[^>]*>/g, '').trim()
        if (cleanText) {
          headingIndex++
          const id = `heading-${headingIndex}`
          tokens[i] = `<${match[1]} id="${id}"${originalAttrs}>`
          
          toc.push({
            id,
            text: cleanText,
            level,
          })
        }
      }
    }
  }

  return {
    processedHtml: tokens.join(''),
    toc,
  }
}

// ─── Next.js Page & Metadata ──────────────────────────────────────────────────

export async function generateMetadata({ params }: SubpageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const now = new Date()

  // Auto-publish past scheduled posts
  await db.blogPost.updateMany({
    where: { status: 'scheduled', publishAt: { lte: now } },
    data: { status: 'published' }
  })

  const post = await db.blogPost.findUnique({
    where: { locale_slug: { locale, slug } }
  })

  // Enforce visibility
  if (!post || post.isDeleted) return {}
  const isScheduledNotYetPublished = post.status === 'scheduled' && new Date(post.publishAt) > now
  if (post.status === 'draft' || isScheduledNotYetPublished) return {}

  const settings = await getMergedSettings(locale)
  const brandName = settings?.brandName || 'IPTV Pro'
  const siteDomain = resolveSiteDomain(settings?.siteDomain)
  const defaultCanonical = publicUrl(siteDomain, locale, `/blog/${slug}`)
  const canonical = post.canonicalUrl || defaultCanonical
  const title = `${post.metaTitle || post.title} – ${brandName}`
  const description = post.metaDescription || post.excerpt || undefined
  const ogImage = settings?.brandLogoUrl || `${siteDomain}/icon.png`

  return {
    title,
    description,
    robots: post.robots || 'index, follow',
    keywords: post.keywords || undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: brandName,
      locale: 'es_ES',
      title,
      description,
      images: [ogImage],
      publishedTime: new Date(post.publishAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      section: post.category,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  guias: { es: 'Guías', fr: 'Guides', en: 'Guides', zh: '指南' },
  dispositivos: { es: 'Dispositivos', fr: 'Appareils', en: 'Devices', zh: '设备' },
  contenido: { es: 'Contenido', fr: 'Contenu', en: 'Content', zh: '内容' },
  comparativas: { es: 'Comparativas', fr: 'Comparatifs', en: 'Comparisons', zh: '对比' },
}

const STYLE_MAP: Record<string, { emoji: string; accent: string; gradient: string }> = {
  guias: { emoji: '📡', accent: '#22d3ee', gradient: 'linear-gradient(135deg, #22d3ee22, #a855f722)' },
  dispositivos: { emoji: '📺', accent: '#a855f7', gradient: 'linear-gradient(135deg, #a855f722, #f472b622)' },
  contenido: { emoji: '⚽', accent: '#f472b6', gradient: 'linear-gradient(135deg, #f472b622, #fbbf2422)' },
  comparativas: { emoji: '🆚', accent: '#10b981', gradient: 'linear-gradient(135deg, #22d3ee22, #10b98122)' },
}

export default async function BlogPostDetailPage({ params }: SubpageProps) {
  const { locale, slug } = await params
  const now = new Date()

  // Auto-publish past scheduled posts
  await db.blogPost.updateMany({
    where: { status: 'scheduled', publishAt: { lte: now } },
    data: { status: 'published' }
  })

  // 1. Fetch Post and Template details
  const post = await db.blogPost.findUnique({
    where: { locale_slug: { locale, slug } },
    include: { template: true }
  })

  if (!post || post.isDeleted) {
    notFound()
  }

  // Enforce scheduled publishing
  const isScheduledNotYetPublished = post.status === 'scheduled' && new Date(post.publishAt) > now
  if (post.status === 'draft' || isScheduledNotYetPublished) {
    notFound()
  }

  const settings = await getMergedSettings(locale)
  const brandName = settings?.brandName || 'IPTV Pro'
  const domain = resolveSiteDomain(settings?.siteDomain)

  const postUrl = publicUrl(domain, locale, `/blog/${slug}`)
  const blogIndexUrl = publicUrl(domain, locale, '/blog')

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: settings?.brandLogoUrl || `${domain}/icon.png`,
    inLanguage: 'es-ES',
    datePublished: new Date(post.publishAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      '@type': 'Organization',
      name: brandName,
      url: domain
    },
    publisher: {
      '@type': 'Organization',
      name: brandName,
      logo: {
        '@type': 'ImageObject',
        url: settings?.brandLogoUrl || `${domain}/icon.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    }
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'es' ? 'Inicio' : locale === 'fr' ? 'Accueil' : locale === 'zh' ? '首页' : 'Home',
        item: domain
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: blogIndexUrl
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postUrl
      }
    ]
  }

  // 2. Compile content modifiers
  let renderedContent = post.content

  // Keyword mapping injection from template
  let keywordLinksMap: Record<string, string> = {}
  if (post.template?.keywordLinks) {
    try {
      keywordLinksMap = JSON.parse(post.template.keywordLinks)
    } catch (e) {}
  }
  renderedContent = injectKeywordLinks(renderedContent, keywordLinksMap)

  // Anchor generation & Table of Contents extraction
  const enableToc = post.template ? post.template.anchorNavEnabled : post.anchorNavEnabled
  const { processedHtml, toc } = processAnchorsAndExtractToc(renderedContent)
  renderedContent = processedHtml

  // 3. Query Recommendation list
  let recsLimit = post.template?.recommendationsCount || 3
  let recsType = post.template?.recommendationsType || 'latest'
  
  let recommendations = []
  if (recsType === 'category') {
    recommendations = await db.blogPost.findMany({
      where: {
        locale,
        category: post.category,
        id: { not: post.id },
        isDeleted: false,
        OR: [
          { status: 'published' },
          { status: 'scheduled', publishAt: { lte: now } }
        ]
      },
      take: recsLimit,
      orderBy: { publishAt: 'desc' }
    })
  } else {
    recommendations = await db.blogPost.findMany({
      where: {
        locale,
        id: { not: post.id },
        isDeleted: false,
        OR: [
          { status: 'published' },
          { status: 'scheduled', publishAt: { lte: now } }
        ]
      },
      take: recsLimit,
      orderBy: { publishAt: 'desc' }
    })
  }

  // 4. Query Previous and Next Posts
  const prevPost = await db.blogPost.findFirst({
    where: {
      locale,
      publishAt: { lt: post.publishAt },
      isDeleted: false,
      OR: [
        { status: 'published' },
        { status: 'scheduled', publishAt: { lte: now } }
      ]
    },
    orderBy: { publishAt: 'desc' }
  })

  const nextPost = await db.blogPost.findFirst({
    where: {
      locale,
      publishAt: { gt: post.publishAt },
      isDeleted: false,
      OR: [
        { status: 'published' },
        { status: 'scheduled', publishAt: { lte: now } }
      ]
    },
    orderBy: { publishAt: 'asc' }
  })

  const catLabel = CATEGORY_LABELS[post.category]?.[locale] || CATEGORY_LABELS[post.category]?.en || post.category
  
  // Format dates
  const formattedPublishDate = new Date(post.publishAt).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="blog-page-wrapper">
      <style>{`
        .blog-page-wrapper {
          min-height: 100vh;
          padding: 120px 1.5rem 5rem;
          background: var(--hero-gradient, linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%));
          color: var(--text-secondary, #94a3b8);
          font-family: Outfit, Inter, sans-serif;
        }
        .blog-article-content h2 {
          color: var(--text-primary, #f1f5f9);
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.3;
          scroll-margin-top: 130px;
        }
        .blog-article-content h3 {
          color: var(--text-primary, #f1f5f9);
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
          scroll-margin-top: 130px;
        }
        .blog-article-content p {
          line-height: 1.8;
          margin-bottom: 1.5rem;
          font-size: 1.05rem;
        }
        .blog-article-content a {
          color: var(--accent-1, #22d3ee);
          text-decoration: underline;
        }
        .blog-article-content ul, .blog-article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          line-height: 1.8;
        }
        .blog-article-content li {
          margin-bottom: 0.5rem;
        }
        .blog-article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        .blog-article-content blockquote {
          border-left: 4px solid var(--accent-1, #22d3ee);
          background: rgba(34, 211, 238, 0.05);
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        .blog-rec-card {
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .blog-rec-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.5) !important;
        }
        .prev-next-card {
          transition: all 0.25s ease-in-out;
        }
        .prev-next-card:hover {
          background: var(--bg-secondary, rgba(255, 255, 255, 0.08)) !important;
          border-color: var(--accent-1, #22d3ee) !important;
          transform: translateY(-2px);
        }
        .blog-article-container {
          background: var(--bg-card, rgba(30, 41, 59, 0.5));
          border: 1px solid var(--border-color, rgba(148, 163, 184, 0.12));
          border-radius: 1.25rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        .blog-article-header {
          padding: 2.5rem 2.5rem 1.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          background: linear-gradient(180deg, rgba(34, 211, 238, 0.03) 0%, transparent 100%);
        }
        .blog-article-content {
          padding: 2.5rem 2.5rem 1.5rem;
          color: var(--text-secondary, #94a3b8);
        }
        .blog-article-nav {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          padding: 1.5rem 2.5rem 2.5rem;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .blog-page-wrapper {
            padding: 80px 0.5rem 3rem !important;
          }
          .blog-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          .blog-article-container {
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          .blog-article-header {
            padding: 1rem 0 !important;
          }
          .blog-article-content {
            padding: 1rem 0 !important;
          }
          .blog-article-nav {
            padding: 1rem 0 !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary, #64748b)',
          marginBottom: '2rem',
        }}>
          <Link href={publicPath(locale, '/')} style={{ color: 'var(--accent-1, #22d3ee)', textDecoration: 'none', fontWeight: 600 }}>
            {locale === 'es' ? 'Inicio' : locale === 'fr' ? 'Accueil' : locale === 'zh' ? '首页' : 'Home'}
          </Link>
          <span>/</span>
          <Link href={publicPath(locale, '/blog')} style={{ color: 'var(--accent-1, #22d3ee)', textDecoration: 'none', fontWeight: 600 }}>
            Blog
          </Link>
          <span>/</span>
          <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
        </div>

        {/* Dynamic Template Header */}
        {post.template?.headerContent && (
          <div 
            style={{ marginBottom: '2rem', width: '100%' }}
            dangerouslySetInnerHTML={{ __html: post.template.headerContent }}
          />
        )}

        {/* 2-Column Split Layout */}
        <div className="blog-detail-grid" style={{
          display: 'grid',
          gridTemplateColumns: enableToc && toc.length > 0 ? '1fr 280px' : '1fr',
          gap: '2.5rem',
          alignItems: 'start'
        }}>
          
          {/* Main content column */}
          <article className="blog-article-container">
            {/* Post Header Hero */}
            <div className="blog-article-header">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <Link href={publicPath(locale, `/blog?category=${post.category}`)} style={{ textDecoration: 'none' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'var(--badge-bg, rgba(34, 211, 238, 0.1))',
                    color: 'var(--accent-1, #22d3ee)',
                    border: '1px solid rgba(34, 211, 238, 0.2)',
                    cursor: 'pointer'
                  }}>
                    {catLabel}
                  </span>
                </Link>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formattedPublishDate}</span>
              </div>
              
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 900,
                color: 'var(--text-primary, #f1f5f9)',
                lineHeight: 1.25,
                margin: '0 0 1rem',
                fontFamily: 'Outfit, Inter, sans-serif'
              }}>
                {post.title}
              </h1>
            </div>

            {/* Post Body Content */}
            <div 
              className="blog-article-content"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />

            {/* Previous / Next Post Navigation */}
            {(prevPost || nextPost) && (
              <div className="blog-article-nav">
                {prevPost ? (
                  <Link href={publicPath(locale, `/blog/${prevPost.slug}`)} className="prev-next-card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    flex: '1 1 200px',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: 'var(--pricing-tab-bg, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-1, #22d3ee)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ← {locale === 'es' ? 'Anterior' : locale === 'fr' ? 'Précédent' : locale === 'zh' ? '上一篇' : 'Previous'}
                    </span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }} title={prevPost.title}>
                      {prevPost.title}
                    </span>
                  </Link>
                ) : <div style={{ flex: '1 1 200px' }} />}

                {nextPost ? (
                  <Link href={publicPath(locale, `/blog/${nextPost.slug}`)} className="prev-next-card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    flex: '1 1 200px',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: 'var(--pricing-tab-bg, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
                    textAlign: 'right',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-1, #22d3ee)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {locale === 'es' ? 'Siguiente' : locale === 'fr' ? 'Suivant' : locale === 'zh' ? '下一篇' : 'Next'} →
                    </span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }} title={nextPost.title}>
                      {nextPost.title}
                    </span>
                  </Link>
                ) : <div style={{ flex: '1 1 200px' }} />}
              </div>
            )}
          </article>

          {/* Sticky Anchor Navigation Column */}
          {enableToc && toc.length > 0 && (
            <BlogTocSidebar toc={toc} titleLabel={locale === 'es' ? 'Índice del artículo' : locale === 'fr' ? 'Sommaire de l\'article' : locale === 'zh' ? '文章目录' : 'Table of Contents'} />
          )}

        </div>

        {/* Dynamic Template Footer */}
        {post.template?.footerContent && (
          <div 
            style={{ marginTop: '3rem', width: '100%' }}
            dangerouslySetInnerHTML={{ __html: post.template.footerContent }}
          />
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section style={{ marginTop: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
              <div style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--accent-gradient, linear-gradient(90deg, #22d3ee, #a855f7))' }} />
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary, #f1f5f9)',
                margin: 0
              }}>
                {locale === 'es' ? 'Artículos recomendados' : locale === 'fr' ? 'Articles recommandés' : locale === 'zh' ? '推荐阅读' : 'Recommended Articles'}
              </h3>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {recommendations.map((rec) => {
                const style = STYLE_MAP[rec.category] || STYLE_MAP.guias
                const cleanText = (rec.content || '').replace(/<[^>]*>/g, '').trim()
                const wordCount = cleanText.split(/\s+/).length
                const minutes = Math.max(1, Math.ceil(wordCount / 220))
                const recReadTime = locale === 'zh' ? `${minutes} 分钟` : `${minutes} min`
                const recCatLabel = CATEGORY_LABELS[rec.category]?.[locale] || CATEGORY_LABELS[rec.category]?.en || rec.category

                return (
                  <Link
                    key={rec.id}
                    href={publicPath(locale, `/blog/${rec.slug}`)}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div className="blog-rec-card" style={{
                      background: 'var(--bg-card, rgba(30, 41, 59, 0.4))',
                      border: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        height: 120,
                        background: style.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <span style={{ fontSize: '3rem' }}>{style.emoji}</span>
                        <div style={{ position: 'absolute', top: 12, left: 14 }}>
                          <span style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: 99,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: 'var(--badge-bg, rgba(34, 211, 238, 0.1))',
                            color: style.accent,
                            border: `1px solid ${style.accent}33`
                          }}>
                            {recCatLabel}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <span>{new Date(rec.publishAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</span>
                          <span>·</span>
                          <span>{recReadTime}</span>
                        </div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--text-primary, #f1f5f9)',
                          lineHeight: 1.4,
                          margin: 0,
                          flex: 1
                        }}>
                          {rec.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
    </>
  )
}
