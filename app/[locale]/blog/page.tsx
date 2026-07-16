import type { Metadata } from 'next'
import { getMergedSettings, resolveSiteDomain } from '@/lib/settings'
import { publicUrl } from '@/lib/seo'
import BlogPageClient from '@/components/frontend/BlogPageClient'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export const revalidate = 60

interface BlogPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params
  const locales = ['es']
  if (!locales.includes(locale)) {
    notFound()
  }
  const settings = await getMergedSettings(locale)
  const brandName = settings?.brandName || 'IGOR IPTV'
  const siteDomain = resolveSiteDomain(settings?.siteDomain)
  const logoUrl = settings?.brandLogoUrl || `${siteDomain}/favicon.png`

  // ── Per-locale SEO copy ────────────────────────────────────────────────────
  const titles: Record<string, string> = {
    es: `Blog IPTV España | Guías, Noticias y Consejos – ${brandName}`,
    fr: `Blog IPTV | Guides, Actualités et Conseils – ${brandName}`,
    en: `IPTV Blog | Guides, News & Tips – ${brandName}`,
    zh: `IPTV 博客 | 指南、新闻与技巧 – ${brandName}`,
  }

  const descs: Record<string, string> = {
    es: `Todo sobre IPTV en España: guías de instalación paso a paso, los mejores canales deportivos, comparativas de servicios IPTV y trucos para optimizar tu experiencia de streaming. Publicado por el equipo de ${brandName}.`,
    fr: `Tout sur l'IPTV : guides d'installation, meilleures chaînes sportives, comparatifs de services IPTV et astuces pour optimiser votre streaming. Publié par l'équipe de ${brandName}.`,
    en: `Everything about IPTV: step-by-step setup guides, best sports channels, IPTV service comparisons and tips to optimize your streaming. Published by the ${brandName} team.`,
    zh: `关于 IPTV 的一切：逐步安装指南、最佳体育频道、IPTV 服务比较和优化流媒体体验的技巧。由 ${brandName} 团队发布。`,
  }

  const ogTitles: Record<string, string> = {
    es: `Blog IPTV España – Guías y Noticias de ${brandName}`,
    fr: `Blog IPTV – Guides et Actualités de ${brandName}`,
    en: `IPTV Blog – Guides & News by ${brandName}`,
    zh: `IPTV 博客 – ${brandName} 指南与新闻`,
  }

  const canonicalUrl = publicUrl(siteDomain, locale, '/blog')

  const title       = titles[locale]  || titles.en
  const description = descs[locale]   || descs.en
  const ogTitle     = ogTitles[locale] || ogTitles.en

  return {
    title,
    description,
    robots: 'index, follow',

    // ── Canonical & hreflang ─────────────────────────────────────────────────
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'es': publicUrl(siteDomain, 'es', '/blog'),
        'x-default': publicUrl(siteDomain, 'es', '/blog'),
      },
    },

    // ── Keywords (used by some search engines & crawlers) ────────────────────
    keywords: locale === 'es'
      ? `IPTV España, ${brandName}, blog IPTV, guía IPTV, canales IPTV España, mejor IPTV ${new Date().getFullYear()}, smart TV IPTV, IPTV legal España, streaming IPTV`
      : locale === 'fr'
      ? `IPTV France, ${brandName}, blog IPTV, guide IPTV, chaînes IPTV, meilleur IPTV ${new Date().getFullYear()}, IPTV smart TV`
      : `IPTV guide, ${brandName}, IPTV blog, best IPTV ${new Date().getFullYear()}, IPTV channels, smart TV IPTV, streaming IPTV`,

    // ── Open Graph ───────────────────────────────────────────────────────────
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: brandName,
      title: ogTitle,
      description,
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      locale: locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : locale === 'zh' ? 'zh_CN' : 'en_US',
    },

    // ── Twitter / X Card ────────────────────────────────────────────────────
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [logoUrl],
    },

    // ── Author & Publisher ───────────────────────────────────────────────────
    authors: [{ name: brandName, url: siteDomain }],
    publisher: brandName,
    category: 'Technology',
  }
}

// ── JSON-LD Blog structured data ─────────────────────────────────────────────
interface BlogSchemaPost {
  slug: string
  title: string
  publishAt: Date
}

function BlogSchema({ locale, settings, domain, posts }: { locale: string; settings: Record<string, string> | null; domain: string; posts: BlogSchemaPost[] }) {
  const brandName  = settings?.brandName  || 'IGOR IPTV'
  const logoUrl    = settings?.brandLogoUrl || `${domain}/favicon.png`

  const names: Record<string, string> = {
    es: `Blog IPTV España – ${brandName}`,
    fr: `Blog IPTV – ${brandName}`,
    en: `IPTV Blog – ${brandName}`,
    zh: `IPTV 博客 – ${brandName}`,
  }
  const descs: Record<string, string> = {
    es: `Guías IPTV, comparativas y noticias para usuarios de IPTV en España. Publicado por ${brandName}.`,
    fr: `Guides IPTV, comparatifs et actualités pour les utilisateurs IPTV. Publié par ${brandName}.`,
    en: `IPTV guides, comparisons and news for IPTV users. Published by ${brandName}.`,
    zh: `IPTV 指南、比较和新闻。由 ${brandName} 发布。`,
  }

  const blogUrl = publicUrl(domain, locale, '/blog')

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: names[locale] || names.en,
    description: descs[locale] || descs.en,
    url: blogUrl,
    inLanguage: locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : locale === 'zh' ? 'zh-CN' : 'en-US',
    publisher: {
      '@type': 'Organization',
      name: brandName,
      url: domain,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: new Date(post.publishAt).toISOString(),
      author: { '@type': 'Organization', name: brandName },
      url: publicUrl(domain, locale, `/blog/${post.slug}`),
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params
  const locales = ['es']
  if (!locales.includes(locale)) {
    notFound()
  }
  const settings = await getMergedSettings(locale)
  const domain = resolveSiteDomain(settings?.siteDomain)

  const now = new Date()

  // Auto-publish past scheduled posts
  await db.blogPost.updateMany({
    where: { status: 'scheduled', publishAt: { lte: now } },
    data: { status: 'published' }
  })

  const dbPosts = await db.blogPost.findMany({
    where: {
      locale,
      isDeleted: false,
      OR: [
        { status: 'published' },
        { status: 'scheduled', publishAt: { lte: now } }
      ]
    },
    orderBy: { publishAt: 'desc' }
  })

  const blogUrl = publicUrl(domain, locale, '/blog')
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
        item: blogUrl
      }
    ]
  }

  return (
    <>
      <BlogSchema locale={locale} settings={settings as Record<string, string> | null} domain={domain} posts={dbPosts} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogPageClient locale={locale} settings={settings} posts={dbPosts} />
    </>
  )
}
