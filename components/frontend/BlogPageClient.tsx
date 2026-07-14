'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { publicPath } from '@/lib/seo'

interface DBPost {
  id: string
  slug: string
  locale: string
  title: string
  excerpt: string
  content: string
  category: string
  publishAt: string | Date
}

interface BlogPageClientProps {
  locale: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
  posts?: DBPost[]
}

// ─── Static fallback posts (when database is empty) ───────────────────────────
const DEMO_POSTS_RAW = [
  {
    id: 'demo-1',
    slug: 'que-es-iptv-guia-completa',
    category: 'guias',
    date: '2026-06-15',
    title: {
      es: '¿Qué es IPTV? La guía definitiva para principiantes',
      fr: "Qu'est-ce que l'IPTV ? Le guide définitif pour débutants",
      en: 'What is IPTV? The ultimate beginner\'s guide',
      zh: '什么是 IPTV？初学者终极指南',
    },
    excerpt: {
      es: 'Aprende todo sobre IPTV: cómo funciona, ventajas frente a la televisión tradicional, y cómo empezar en minutos con cualquier dispositivo.',
      fr: "Apprenez tout sur l'IPTV : comment ça marche, les avantages par rapport à la télévision traditionnelle et comment démarrer en quelques minutes.",
      en: 'Learn everything about IPTV: how it works, advantages over traditional TV, and how to get started in minutes on any device.',
      zh: '了解 IPTV 的一切：工作原理、相对传统电视的优势，以及如何在几分钟内在任何设备上开始使用。',
    },
    content: 'IPTV Content',
    featured: true,
  },
  {
    id: 'demo-2',
    slug: 'mejor-iptv-smart-tv-2025',
    category: 'dispositivos',
    date: '2026-06-10',
    title: {
      es: 'Mejor IPTV para Smart TV en 2025: Configuración paso a paso',
      fr: 'Meilleur IPTV pour Smart TV en 2025 : Configuration étape par étape',
      en: 'Best IPTV for Smart TV in 2025: Step-by-step setup',
      zh: '2025 年最佳智能电视 IPTV：逐步配置指南',
    },
    excerpt: {
      es: 'Descubre cómo instalar and configurar IPTV en tu Smart TV Samsung, LG o Android TV en pocos pasos y sin complicaciones técnicas.',
      fr: 'Découvrez comment installer et configurer IPTV sur votre Smart TV Samsung, LG ou Android TV en quelques étapes simples.',
      en: 'Discover how to install and configure IPTV on your Samsung, LG, or Android TV in just a few easy steps.',
      zh: '了解如何在几个简单步骤内在三星、LG 或 Android 智能电视上安装和配置 IPTV。',
    },
    content: 'IPTV Smart TV content',
    featured: false,
  },
  {
    id: 'demo-3',
    slug: 'canales-deportivos-iptv',
    category: 'contenido',
    date: '2026-06-05',
    title: {
      es: 'Los mejores canales deportivos disponibles con IPTV',
      fr: 'Les meilleures chaînes sportives disponibles avec IPTV',
      en: 'The best sports channels available with IPTV',
      zh: '通过 IPTV 可以收看的最佳体育频道',
    },
    excerpt: {
      es: 'Fútbol, tenis, F1, NBA y mucho más. Descubre todos los canales deportivos premium que puedes ver con tu suscripción IPTV.',
      fr: 'Football, tennis, F1, NBA et bien plus. Découvrez toutes les chaînes sportives premium avec votre abonnement IPTV.',
      en: 'Football, tennis, F1, NBA and much more. Discover all the premium sports channels you can watch with your IPTV subscription.',
      zh: '足球、网球、F1、NBA 等等。了解您可以通过 IPTV 订阅观看的所有高级体育频道。',
    },
    content: 'Sports channels content',
    featured: false,
  },
  {
    id: 'demo-4',
    slug: 'iptv-vs-netflix-diferencias',
    category: 'comparativas',
    date: '2026-05-28',
    title: {
      es: 'IPTV vs Netflix: ¿Cuál es mejor para ti en 2025?',
      fr: 'IPTV vs Netflix : Lequel est le meilleur pour vous en 2025 ?',
      en: 'IPTV vs Netflix: Which is better for you in 2025?',
      zh: 'IPTV 与 Netflix 对比：2025 年哪个更适合你？',
    },
    excerpt: {
      es: 'Comparamos IPTV y Netflix en precio, contenido, calidad de imagen y facilidad de uso. ¿Cuál se adapta mejor a tus necesidades?',
      fr: 'Nous comparons IPTV et Netflix en termes de prix, contenu, qualité d\'image et facilité d\'utilisation.',
      en: 'We compare IPTV and Netflix on price, content, image quality, and ease of use. Which one fits your needs best?',
      zh: '我们在价格、内容、画质和使用便捷性方面对 IPTV 和 Netflix 进行比较。',
    },
    content: 'IPTV vs Netflix content',
    featured: false,
  },
  {
    id: 'demo-5',
    slug: 'solucionar-problemas-iptv-buffering',
    category: 'guias',
    date: '2026-05-20',
    title: {
      es: 'Cómo solucionar el buffering en IPTV: 10 soluciones efectivas',
      fr: 'Comment résoudre le buffering sur IPTV : 10 solutions efficaces',
      en: 'How to fix IPTV buffering: 10 effective solutions',
      zh: '如何解决 IPTV 缓冲问题：10 个有效解决方案',
    },
    excerpt: {
      es: 'El buffering puede arruinar tu experiencia IPTV. Aprende las 10 técnicas más eficaces para eliminarlo y disfrutar de streaming fluido.',
      fr: 'Le buffering peut gâcher votre expérience IPTV. Découvrez les 10 techniques les plus efficaces pour l\'éliminer.',
      en: 'Buffering can ruin your IPTV experience. Learn the 10 most effective techniques to eliminate it and enjoy smooth streaming.',
      zh: '缓冲可能会毁掉您的 IPTV 体验。学习 10 种最有效的技术来消除缓冲，享受流畅的流媒体。',
    },
    content: 'Buffering content',
    featured: false,
  },
  {
    id: 'demo-6',
    slug: 'peliculas-series-iptv-vod',
    category: 'contenido',
    date: '2026-05-15',
    title: {
      es: 'Películas y series en IPTV: Todo sobre el VOD',
      fr: 'Films et séries en IPTV : Tout sur le VOD',
      en: 'Movies and series on IPTV: Everything about VOD',
      zh: 'IPTV 中的电影和剧集：关于 VOD 的一切',
    },
    excerpt: {
      es: 'La videodemanda (VOD) lleva IPTV más allá de la TV en directo. Descubre cómo acceder a miles de películas y series bajo demanda.',
      fr: 'La vidéo à la demande (VOD) va bien au-delà de la TV en direct. Découvrez comment accéder à des milliers de films et séries.',
      en: 'Video on Demand (VOD) takes IPTV beyond live TV. Discover how to access thousands of movies and series on demand.',
      zh: '视频点播 (VOD) 将 IPTV 带到直播电视之外。了解如何访问数千部电影和剧集。',
    },
    content: 'VOD Content',
    featured: false,
  },
]

const CATEGORIES = [
  { id: 'all',        label: { es: 'Todos', fr: 'Tous', en: 'All', zh: '全部' } },
  { id: 'guias',      label: { es: 'Guías', fr: 'Guides', en: 'Guides', zh: '指南' } },
  { id: 'dispositivos', label: { es: 'Dispositivos', fr: 'Appareils', en: 'Devices', zh: '设备' } },
  { id: 'contenido',  label: { es: 'Contenido', fr: 'Contenu', en: 'Content', zh: '内容' } },
  { id: 'comparativas', label: { es: 'Comparativas', fr: 'Comparatifs', en: 'Comparisons', zh: '对比' } },
]

const STYLE_MAP: Record<string, { emoji: string; accent: string; gradient: string }> = {
  guias: { emoji: '📡', accent: '#22d3ee', gradient: 'linear-gradient(135deg, #22d3ee22, #a855f722)' },
  dispositivos: { emoji: '📺', accent: '#a855f7', gradient: 'linear-gradient(135deg, #a855f722, #f472b622)' },
  contenido: { emoji: '⚽', accent: '#f472b6', gradient: 'linear-gradient(135deg, #f472b622, #fbbf2422)' },
  comparativas: { emoji: '🆚', accent: '#10b981', gradient: 'linear-gradient(135deg, #22d3ee22, #10b98122)' },
}

const T = {
  hero_badge:  { es: '✨ Blog Oficial', fr: '✨ Blog Officiel', en: '✨ Official Blog', zh: '✨ 官方博客' },
  hero_title:  { es: 'Todo sobre IPTV', fr: 'Tout sur l\'IPTV', en: 'Everything About IPTV', zh: '关于 IPTV 的一切' },
  hero_sub:    {
    es: 'Guías, comparativas, trucos y noticias del mundo IPTV — publicados por expertos para que saques el máximo partido a tu servicio.',
    fr: 'Guides, comparatifs, astuces et actualités du monde IPTV — publiés par des experts pour tirer le meilleur parti de votre service.',
    en: 'Guides, comparisons, tips, and IPTV industry news — published by experts so you get the most out of your service.',
    zh: '指南、比较、技巧和 IPTV 行业新闻——由专家发布，帮助您充分利用您的服务。',
  },
  featured:    { es: 'Artículo destacado', fr: 'Article en vedette', en: 'Featured Article', zh: '精选文章' },
  read_more:   { es: 'Leer artículo →', fr: 'Lire l\'article →', en: 'Read article →', zh: '阅读文章 →' },
  read_art:    { es: 'Leer →', fr: 'Lire →', en: 'Read →', zh: '阅读 →' },
  latest:      { es: 'Últimos artículos', fr: 'Derniers articles', en: 'Latest Articles', zh: '最新文章' },
  latest_sub:  { es: 'Explora nuestra colección completa de guías y recursos IPTV', fr: 'Explorez notre collection complète de guides et ressources IPTV', en: 'Explore our full collection of IPTV guides and resources', zh: '探索我们完整的 IPTV 指南和资源集合' },
  wa_badge:    { es: 'IPTV España Prueba', fr: 'IPTV France Essai', en: 'IPTV Trial', zh: 'IPTV 试用' },
  wa_title:    { es: 'IPTV Prueba de 24 Horas', fr: 'Essai IPTV de 24 Heures', en: '24-Hour IPTV Trial', zh: '24小时 IPTV 试用' },
  wa_body:     {
    es: 'Si no conoce la lista de IGOR IPTV España antes de comprar, puede contactar con IGOR por WhatsApp para solicitar una IPTV Prueba gratuita. Compre solo después de estar satisfecho con the IPTV Prueba.',
    fr: "Si vous ne connaissez pas la liste d'IGOR IPTV avant d'acheter, contactez IGOR par WhatsApp pour demander un essai IPTV gratuit. Achetez seulement après avoir été satisfait de l'essai.",
    en: 'If you are not familiar with the IGOR IPTV list before purchasing, you can contact IGOR via WhatsApp to request a free IPTV trial. Buy only after you are satisfied with the trial.',
    zh: '如果您在购买前不了解 IGOR IPTV 的频道列表，可以通过 WhatsApp 联系 IGOR 申请免费试用。满意后再购买。',
  },
  wa_btn:      { es: 'WhatsApp →', fr: 'WhatsApp →', en: 'WhatsApp →', zh: 'WhatsApp →' },
}

function t(key: keyof typeof T, locale: string): string {
  const map = T[key] as Record<string, string>
  return map[locale] || map.en
}

function formatDate(dateStr: string | Date, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
}

// Calculate dynamic reading time based on HTML content length
function getReadTime(content: string, locale: string): string {
  const cleanText = (content || '').replace(/<[^>]*>/g, '').trim()
  const wordCount = cleanText.split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(wordCount / 220))
  return locale === 'zh' ? `${minutes} 分钟` : `${minutes} min`
}

export default function BlogPageClient({ locale, settings, posts = [] }: BlogPageClientProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const cat = params.get('category')
      if (cat && CATEGORIES.some(c => c.id === cat)) {
        setActiveCategory(cat)
      }
    }
  }, [])

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (catId === 'all') {
        url.searchParams.delete('category')
      } else {
        url.searchParams.set('category', catId)
      }
      window.history.pushState({}, '', url.pathname + url.search)
    }
  }

  const whatsappNumber = (settings?.whatsappNumber || '').replace(/\D/g, '')
  const whatsappMsg = encodeURIComponent(
    locale === 'es' ? 'Hola, me gustaría solicitar una IPTV Prueba gratuita de 24 horas.' :
    locale === 'fr' ? "Bonjour, je voudrais demander un essai IPTV gratuit de 24 heures." :
    locale === 'zh' ? '您好，我想申请24小时免费IPTV试用。' :
    'Hello, I would like to request a free 24-hour IPTV trial.'
  )
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`
    : '#'

  // 1. Normalize posts to unified rendering format
  let rawList = posts
  let isDemo = false

  if (!rawList || rawList.length === 0) {
    isDemo = true
    // Map demo posts to DBPost shape
    rawList = DEMO_POSTS_RAW.map(p => ({
      id: p.id,
      slug: p.slug,
      locale,
      title: p.title[locale as keyof typeof p.title] || p.title.en,
      excerpt: p.excerpt[locale as keyof typeof p.excerpt] || p.excerpt.en,
      content: p.content,
      category: p.category,
      publishAt: new Date(p.date).toISOString(),
    }))
  }

  // 2. Add visual parameters (emoji, gradient, accent, categoryLabel, readTime)
  const normalizedPosts = rawList.map((p, idx) => {
    const style = STYLE_MAP[p.category] || STYLE_MAP.guias
    const cat = CATEGORIES.find(c => c.id === p.category)
    const categoryLabel = cat ? (cat.label[locale as keyof typeof cat.label] || cat.label.en) : p.category
    
    // Make the first post featured by default if there's no custom flag (or first element)
    const isFeatured = isDemo ? (DEMO_POSTS_RAW[idx]?.featured || false) : (idx === 0)

    return {
      ...p,
      ...style,
      categoryLabel,
      readTime: getReadTime(p.content, locale),
      featured: isFeatured,
    }
  })

  const featured = normalizedPosts.find(p => p.featured) || normalizedPosts[0]
  
  // Filter for late-articles list (exclude the featured post)
  const filtered = normalizedPosts.filter(p => {
    const notFeatured = featured ? p.id !== featured.id : true
    const categoryMatch = activeCategory === 'all' || p.category === activeCategory
    return notFeatured && categoryMatch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Outfit, Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
          50%       { box-shadow: 0 0 24px 4px rgba(34,211,238,0.18); }
        }
        .blog-hero-title {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shimmer 4s linear infinite;
        }
        .blog-card {
          transition: transform 0.32s cubic-bezier(.22,.68,0,1.2), box-shadow 0.32s ease;
        }
        .blog-card:hover {
          transform: translateY(-6px) scale(1.012);
          box-shadow: var(--card-shadow-hover) !important;
        }
        .blog-cat-chip {
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.18s;
          border: 1.5px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
        }
        .blog-cat-chip:hover {
          border-color: var(--accent-1);
          color: var(--accent-1);
          transform: translateY(-1px);
        }
        .blog-cat-chip.active {
          background: var(--accent-gradient);
          color: #fff;
          border-color: transparent;
        }
        .blog-read-btn {
          transition: opacity 0.2s, transform 0.2s;
        }
        .blog-read-btn:hover { opacity: 0.85; transform: translateX(3px); }
        .nl-input:focus {
          outline: none;
          border-color: var(--accent-1);
          box-shadow: 0 0 0 3px var(--input-focus);
        }
        .nl-btn {
          transition: opacity 0.2s, transform 0.18s, box-shadow 0.2s;
        }
        .nl-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: var(--btn-primary-shadow); }
        .featured-img-bg {
          background: var(--accent-gradient);
          opacity: 0.12;
          position: absolute; inset: 0; border-radius: inherit;
        }
        .featured-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 640px) {
          .featured-inner {
            grid-template-columns: 1fr !important;
          }
          .featured-emoji-zone {
            min-height: 180px !important;
            padding: 2rem !important;
          }
          .featured-text-zone {
            padding: 1.5rem !important;
          }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '130px 1.5rem 80px',
        background: 'var(--hero-gradient)',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', animation: 'fadeInUp 0.7s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 1rem', borderRadius: 99,
            background: 'var(--badge-bg)', border: '1px solid var(--badge-border)',
            color: 'var(--badge-text)', fontSize: '0.82rem', fontWeight: 600,
            letterSpacing: '0.04em', marginBottom: '1.5rem',
          }}>
            {t('hero_badge', locale)}
          </div>

          <h1 className="blog-hero-title" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            {t('hero_title', locale)}
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 620, margin: '0 auto' }}>
            {t('hero_sub', locale)}
          </p>
        </div>
      </section>

      {/* ── FEATURED POST ─────────────────────────────────────────────── */}
      {featured && (
        <section style={{ padding: '4rem 1.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--accent-gradient)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('featured', locale)}</span>
          </div>

          <Link href={publicPath(locale, `/blog/${featured.slug}`)} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="blog-card" style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              backdropFilter: 'var(--card-backdrop)',
              boxShadow: 'var(--card-shadow)',
              cursor: 'pointer',
            }}>
              <div style={{ width: 6, background: 'var(--accent-gradient)' }} />

              <div className="featured-inner">
                <div className="featured-emoji-zone" style={{ position: 'relative', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
                  <div className="featured-img-bg" />
                  <div style={{ position: 'relative', fontSize: '7rem', lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(34,211,238,0.3))' }}>
                    {featured.emoji}
                  </div>
                </div>

                <div className="featured-text-zone" style={{ padding: '2.5rem 2.5rem 2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCategoryChange(featured.category)
                      }}
                      style={{ padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700, background: 'var(--badge-bg)', color: 'var(--badge-text)', border: '1px solid var(--badge-border)', cursor: 'pointer' }}
                    >
                      {featured.categoryLabel}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(featured.publishAt, locale)}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>· {featured.readTime}</span>
                  </div>

                  <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                    {featured.title}
                  </h2>

                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {featured.excerpt}
                  </p>

                  <div className="blog-read-btn" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.65rem 1.4rem', borderRadius: 99, width: 'fit-content',
                    background: 'var(--btn-primary-bg)', color: '#fff',
                    fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: 'var(--btn-primary-shadow)',
                  }}>
                    {t('read_more', locale)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── ARTICLE GRID ──────────────────────────────────────────────── */}
      {normalizedPosts.length > 1 && (
        <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--accent-gradient)' }} />
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{t('latest', locale)}</h2>
              <div style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--accent-gradient)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 500, margin: 0 }}>{t('latest_sub', locale)}</p>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`blog-cat-chip${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                style={{ padding: '0.45rem 1.1rem', borderRadius: 99, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {(cat.label as Record<string, string>)[locale] || cat.label.en}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((post, i) => (
              <Link
                key={post.id}
                href={publicPath(locale, `/blog/${post.slug}`)}
                style={{ textDecoration: 'none', display: 'block', animation: `fadeInUp 0.5s ease ${i * 0.07}s both` }}
              >
                <div className="blog-card" style={{
                  height: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  backdropFilter: 'var(--card-backdrop)',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    position: 'relative',
                    height: 140,
                    background: post.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <div style={{ fontSize: '4rem', lineHeight: 1, filter: `drop-shadow(0 4px 12px ${post.accent}66)` }}>
                      {post.emoji}
                    </div>
                    <div style={{ position: 'absolute', top: 12, left: 14 }}>
                      <span 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCategoryChange(post.category)
                        }}
                        style={{ padding: '0.2rem 0.65rem', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: 'var(--badge-bg)', color: post.accent, border: `1px solid ${post.accent}44`, cursor: 'pointer' }}
                      >
                        {post.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1.4rem 1.5rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{formatDate(post.publishAt, locale)}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0 }}>
                      {post.title}
                    </h3>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, flex: 1 }}>
                      {post.excerpt}
                    </p>

                    <div className="blog-read-btn" style={{ fontSize: '0.85rem', fontWeight: 700, color: post.accent, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                      {t('read_art', locale)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ fontSize: '1.1rem' }}>No articles in this category yet.</p>
            </div>
          )}
        </section>
      )}

      {/* ── WHATSAPP TRIAL CTA ────────────────────────────────────────── */}
      <section style={{ padding: '0 1.5rem 6rem', maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          position: 'relative',
          padding: '3rem 2.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.5rem',
          backdropFilter: 'var(--card-backdrop)',
          boxShadow: 'var(--card-shadow)',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.35rem 1.1rem', borderRadius: 99, marginBottom: '1.25rem',
              border: '1.5px solid var(--border-accent)',
              color: 'var(--accent-1)', fontSize: '0.82rem', fontWeight: 600,
            }}>
              {t('wa_badge', locale)}
            </div>

            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {t('wa_title', locale)}
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.97rem', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 460, margin: '0 auto 2rem' }}>
              {t('wa_body', locale)}
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nl-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.85rem 2rem', borderRadius: 99,
                background: 'var(--btn-primary-bg)',
                color: '#fff', fontWeight: 800, fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: 'var(--btn-primary-shadow)',
              }}
            >
              {t('wa_btn', locale)}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
