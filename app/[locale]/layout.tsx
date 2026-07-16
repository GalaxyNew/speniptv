import type { Metadata } from 'next'
import React from 'react'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getMergedSettings, resolveSiteDomain } from '@/lib/settings'
import { draftMode } from 'next/headers'
import NavBar from '@/components/frontend/NavBar'
import Footer from '@/components/frontend/Footer'
import EditToolbar from '@/components/frontend/EditToolbar'
import SupportWidgets from '@/components/frontend/SupportWidgets'
import { parseButtonValue, getButtonLinkProps } from '@/lib/button'
import { publicUrl } from '@/lib/seo'

function parseHTMLToReact(html: string): React.ReactNode[] {
  if (!html) return [];
  
  const tagRegex = /<(script|link|style|meta|noscript|title)([^>]*)>([\s\S]*?)<\/\1>|<(link|meta)([^>]*)\/?>/gi;
  const nodes: React.ReactNode[] = [];
  let match;
  let key = 0;
  
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = (match[1] || match[4]).toLowerCase();
    const attrsStr = match[2] || match[5] || '';
    const content = match[3] || '';
    
    const attrs: Record<string, any> = {};
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      const name = attrMatch[1];
      const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? true;
      
      let reactName = name;
      if (name === 'class') reactName = 'className';
      else if (name === 'crossorigin') reactName = 'crossOrigin';
      else if (name === 'charset') reactName = 'charSet';
      else if (name === 'http-equiv') reactName = 'httpEquiv';
      
      attrs[reactName] = val;
    }
    
    attrs.key = `inject-${tagName}-${key++}`;
    
    if (content) {
      attrs.dangerouslySetInnerHTML = { __html: content };
    }
    
    nodes.push(React.createElement(tagName, attrs));
  }
  
  return nodes;
}



const locales = ['es'] as const
// ISR: content changes are infrequent, so serve cached HTML and revalidate in
// the background every 60s instead of hitting the DB on every request.
export const revalidate = 60
type Locale = (typeof locales)[number]

// Google Fonts axis spec per family. Only the two hardcoded fallback fonts
// (Outfit, Inter — referenced across many components) plus the active font are
// loaded, instead of all ~10 families, to cut render-blocking font weight.
const FONT_AXIS: Record<string, string> = {
  'Outfit': 'wght@300;400;500;600;700;800;900',
  'Inter': 'wght@300;400;500;600;700;800;900',
  'Poppins': 'wght@300;400;500;600;700;800;900',
  'Montserrat': 'wght@300;400;500;600;700;800;900',
  'Space Grotesk': 'wght@300;400;500;600;700',
  'Playfair Display': 'ital,wght@0,400..900;1,400..900',
  'Cormorant Garamond': 'ital,wght@0,300..700;1,300..700',
  'Cinzel': 'wght@400..900',
  'Syne': 'wght@400..800',
}

function buildFontHref(activeFont: string): string {
  const families = ['Outfit', 'Inter']
  if (activeFont && !families.includes(activeFont)) families.push(activeFont)
  const parts = families.map((f) => {
    const axis = FONT_AXIS[f] || 'wght@300;400;500;600;700;800;900'
    return `family=${f.replace(/ /g, '+')}:${axis}`
  })
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`
}


interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!locales.includes(locale as any)) {
    notFound()
  }
  const seo = await db.pageSeo.findUnique({ where: { locale } })
  const settings = await getMergedSettings(locale)

  const domain = resolveSiteDomain(settings?.siteDomain)
  const homeUrl = publicUrl(domain, locale)
  const brandName = settings?.brandName ?? 'IPTV Pro'
  const fallbackDescription = `${brandName}: suscripción IPTV premium con miles de canales, películas y series en 4K/FHD, compatible con Smart TV, Android, iOS y más.`

  return {
    metadataBase: new URL(domain),
    title: seo?.metaTitle ?? brandName,
    description: seo?.metaDescription || fallbackDescription,
    robots: seo?.robots ?? 'index, follow',
    alternates: {
      canonical: seo?.canonicalUrl || homeUrl,
      languages: {
        'es': homeUrl,
        'x-default': homeUrl,
      },
    },
    verification: {
      google: settings?.googleSiteVerification || undefined,
      other: settings?.bingSiteVerification ? {
        'msvalidate.01': [settings.bingSiteVerification]
      } : undefined,
    },
    openGraph: {
      type: 'website',
      url: homeUrl,
      locale: 'es_ES',
      title: seo?.ogTitle || seo?.metaTitle || brandName,
      description: seo?.ogDescription || seo?.metaDescription || fallbackDescription,
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : (settings?.brandLogoUrl ? [settings.brandLogoUrl] : []),
      siteName: brandName,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.ogTitle || seo?.metaTitle || brandName,
      description: seo?.ogDescription || seo?.metaDescription || fallbackDescription,
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : (settings?.brandLogoUrl ? [settings.brandLogoUrl] : []),
    },
    icons: {
      icon: settings?.faviconUrl || '/favicon.ico',
      shortcut: settings?.faviconUrl || '/favicon.ico',
      apple: settings?.faviconUrl || '/icon.png',
    },
    other: settings?.googleSearchImageUrl ? {
      thumbnail: settings.googleSearchImageUrl,
    } : undefined,
  }
}


export default async function LocaleLayout({ params, children }: LocaleLayoutProps) {
  const { locale } = await params

  if (!locales.includes(locale as any)) {
    notFound()
  }

  const { isEnabled: editMode } = await draftMode()

  const [modules, settings, schema, supportContents, faqContents, headerContents, footerContents] = await Promise.all([
    db.pageModule.findMany({ orderBy: { sortOrder: 'asc' } }),
    getMergedSettings(locale),
    db.schemaConfig.findUnique({ where: { id: locale } }).then(s => s || db.schemaConfig.findUnique({ where: { id: 'main' } })),
    db.moduleContent.findMany({ where: { moduleId: 'support_popup', locale } }),
    db.moduleContent.findMany({ where: { moduleId: 'faq', locale } }),
    db.moduleContent.findMany({ where: { moduleId: 'header', locale } }),
    db.moduleContent.findMany({ where: { moduleId: 'footer', locale } }),
  ])
  
  const domain = resolveSiteDomain(settings?.siteDomain)

  const supportC = Object.fromEntries(supportContents.map((x) => [x.key, x.value]))
  const faqMap = Object.fromEntries(faqContents.map((x) => [x.key, x.value]))
  const headerC = Object.fromEntries(headerContents.map((x) => [x.key, x.value]))
  const footerC = Object.fromEntries(footerContents.map((x) => [x.key, x.value]))

  // Self-healing database check to register the affiliate_links module and default content
  let pageModules = modules
  const hasAffiliateLinksModule = pageModules.some((m) => m.id === 'affiliate_links')
  if (!hasAffiliateLinksModule) {
    try {
      await db.pageModule.upsert({
        where: { id: 'affiliate_links' },
        update: {},
        create: {
          id: 'affiliate_links',
          isVisible: true,
          isVisible_fr: true,
          isVisible_es: true,
          isVisible_en: true,
          isVisible_zh: true,
          sortOrder: 13,
          sortOrder_fr: 13,
          sortOrder_es: 13,
          sortOrder_en: 13,
          sortOrder_zh: 13,
        },
      })
      const defaultTexts = {
        badge: '🔗 Enlaces de Socios',
        title: 'Nuestros Socios Oficiales',
        subtitle: 'Descubra nuestros socios de confianza para optimizar su experiencia de IPTV.',
      }
      for (const [key, value] of Object.entries(defaultTexts)) {
        await db.moduleContent.upsert({
          where: { moduleId_locale_key: { moduleId: 'affiliate_links', locale: 'es', key } },
          update: {},
          create: { moduleId: 'affiliate_links', locale: 'es', key, value },
        })
      }
      pageModules = await db.pageModule.findMany({ orderBy: { sortOrder: 'asc' } })
    } catch (err) {
      console.error('Failed to auto-seed affiliate_links module:', err)
    }
  }
  try {
    const policies = [
      {
        slug: 'legal',
        title: 'Aviso Legal',
        content: '<h2>1. Datos identificativos</h2><p>El sitio web es operado bajo la marca {brand}.</p><h2>2. Propiedad intelectual</h2><p>Todos los derechos de propiedad intelectual del contenido de este sitio pertenecen a {brand}.</p>',
      },
      {
        slug: 'privacy-policy',
        title: 'Política de Privacidad',
        content: `<h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">1. Recopilación de información</h2><p style="margin-bottom: 1rem;">Recopilamos información de diversas formas para ofrecer y mejorar la calidad de nuestro servicio de streaming. Esto incluye la información que usted nos proporciona directamente al registrarse (como dirección de correo electrónico) y datos técnicos recopilados automáticamente (como dirección IP, tipo de dispositivo, sistema operativo, datos de conexión y patrones de uso).</p><h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">2. Uso y finalidad de los datos</h2><p style="margin-bottom: 1rem;">Utilizamos la información recopilada exclusivamente para mantener, optimizar y personalizar su experiencia de transmisión, así como para procesar pagos and brindar soporte técnico. No realizamos perfiles intrusivos ni vendemos su información a terceros.</p><h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">3. Protección y seguridad de los datos</h2><p style="margin-bottom: 1rem;">La seguridad de su privacidad es nuestra máxima prioridad. Implementamos medidas técnicas, administrativas y físicas altamente avanzadas para salvaguardar sus datos personales contra el acceso no autorizado, alteración, divulgación o destrucción. Nos comprometemos firmemente a proteger su información y garantizar que sus datos no sean objeto de abusos ni usos indebidos.</p><h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">4. Compromiso de no abuso</h2><p style="margin-bottom: 1rem;">Declaramos explícitamente que nunca utilizaremos sus datos personales para fines ajenos a la prestación del servicio acordado, ni los utilizaremos para enviar publicidad no deseada (spam) sin su consentimiento explícito previo. Sus datos se almacenan de forma segura y solo durante el tiempo estrictamente necesario.</p>`,
      },
      {
        slug: 'terms-of-service',
        title: 'Condiciones de servicio',
        content: `<h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">¡Bienvenido a {brand}!</h2>
<p style="margin-bottom: 1rem;">Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de {brand}, ubicado en su dirección de dominio correspondiente.</p>
<p style="margin-bottom: 1rem;">Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando nuestro servicio si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.</p>
<p style="margin-bottom: 1.5rem;">La siguiente terminología se aplica a estos Términos y Condiciones, Declaración de Privacidad y Aviso de Descargo de Responsabilidad y todos los Acuerdos: “Cliente”, “Usted” y “Su” se refieren a usted, la persona que inicia sesión en este sitio web y cumple con los términos y condiciones de la Compañía. “La Compañía”, “Nosotros”, “Nuestro” y “Nuestra” se refiere a nuestra Compañía. “Parte”, “Partes” o “Nosotros” se refiere tanto al Cliente como a nosotros mismos. Todos los términos se refieren a la oferta, aceptación y consideración del pago necesario para llevar a cabo el proceso de nuestra asistencia al Cliente de la manera más apropiada para el propósito expreso de satisfacer las necesidades del Cliente con respecto al suministro de los servicios declarados de la Compañía, de acuerdo con y sujeto a la ley vigente.</p>
<h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">Cookies</h2>
<p style="margin-bottom: 1rem;">Utilizamos cookies. Al acceder a {brand}, aceptas usar cookies de acuerdo con nuestra Política de Privacidad.</p>
<p style="margin-bottom: 1.5rem;">La mayoría de los sitios web interactivos usan cookies para permitirnos recuperar los detalles del usuario en cada visita. Las cookies son utilizadas por nuestro sitio web para habilitar la funcionalidad de ciertas áreas y facilitar la visita de las personas a nuestro sitio web. Algunos de nuestros socios afiliados/publicitarios también pueden usar cookies.</p>
<h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">Licencia</h2>
<p style="margin-bottom: 1rem;">A menos que se indique lo contrario, {brand} y/o sus licenciantes son propietarios de los derechos de propiedad intelectual de todo el material en este sitio. Todos los derechos de propiedad intelectual están reservados. Puedes acceder a esto para tu uso personal sujeto a las restricciones establecidas en estos términos y condiciones.</p>
<p style="margin-bottom: 1rem; font-weight: 600;">No debes:</p>
<ul style="padding-left: 1.25rem; margin-bottom: 1rem; list-style-type: disc;">
<li style="margin-bottom: 0.5rem;">Republicar material de nuestro sitio</li>
<li style="margin-bottom: 0.5rem;">Vender, alquilar o sublicenciar material de nuestro sitio</li>
<li style="margin-bottom: 0.5rem;">Reproducir, duplicar o copiar material de nuestro sitio</li>
<li style="margin-bottom: 0.5rem;">Redistribuir contenido de nuestro sitio</li>
</ul>`,
      },
      {
        slug: 'refund-policy',
        title: 'Política de reembolso',
        content: '<h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">Garantía de Reembolso en 15 Días</h2><p style="margin-bottom: 1rem;">En {brand}, queremos asegurarnos de que estés 100% satisfecho con nuestro servicio. Si tienes alguna consulta técnica, no dudes en contactarnos. ¡Nuestro equipo técnico no te dejará hasta que estés viendo la televisión! Sin embargo, si sientes que el servicio que compraste no es el más adecuado para tus requisitos y has intentado resolver los problemas con nuestro personal de soporte, queremos solucionarlo.</p><p style="margin-bottom: 1.5rem;">Aunque nos encantaría saber en qué fallamos o cómo podemos mejorar, sigue los pasos a continuación para obtener un reembolso completo dentro de los 15 días posteriores a la fecha de tu compra. Si han pasado los 15 días y tienes un problema, puedes contactarnos en cualquier momento a través de nuestro chat o por correo electrónico para solucionar tu problema.</p><h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 1.5rem; margin-bottom: 1rem;">Pasos para Solicitar un Reembolso</h2><ol style="padding-left: 1.25rem; margin-bottom: 1rem; list-style-type: decimal;"><li style="margin-bottom: 0.5rem;">Utiliza el formulario de Contacto para solicitar un reembolso.</li><li style="margin-bottom: 0.5rem;">Usa la misma dirección de correo electrónico con la que compraste nuestros servicios.</li><li style="margin-bottom: 0.5rem;">Incluye tu número de factura.</li></ol>',
      }
    ]

    const brandName = settings?.brandName || 'IPTV Pro'

    for (const policy of policies) {
      await db.subpage.upsert({
        where: { locale_slug: { locale: 'es', slug: policy.slug } },
        update: {
          robots: 'noindex, nofollow',
        },
        create: {
          slug: policy.slug,
          locale: 'es',
          title: policy.title,
          content: policy.content,
          isVisible: true,
          metaTitle: policy.title,
          metaDescription: `${policy.title} - ${brandName}`,
          robots: 'noindex, nofollow',
        }
      })
    }
  } catch (err) {
    console.error('Failed to auto-seed policy pages:', err)
  }



  const theme = settings?.activeTheme ?? 'dark-tech'
  const font = settings?.activeFont ?? 'Outfit'

  // Structured Data 1: Organization
  const orgSchema = schema ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: schema.orgName || settings?.brandName,
    url: schema.orgUrl && schema.orgUrl !== 'https://example.com' ? schema.orgUrl : domain,
    logo: schema.orgLogoUrl && schema.orgLogoUrl !== 'https://example.com/logo.png' ? schema.orgLogoUrl : (settings?.brandLogoUrl || `${domain}/icon.png`),
    contactPoint: (schema.orgPhone || schema.orgEmail) ? {
      '@type': 'ContactPoint',
      telephone: schema.orgPhone || undefined,
      email: schema.orgEmail || undefined,
      contactType: 'customer service'
    } : undefined,
    address: schema.orgAddress ? {
      '@type': 'PostalAddress',
      streetAddress: schema.orgAddress
    } : undefined
  } : null

  // Structured Data 2: Product & Rating
  const productSchema = schema ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: schema.orgName || settings?.brandName || 'IPTV Pro',
    image: schema.orgLogoUrl || settings?.brandLogoUrl || undefined,
    description: settings?.brandSlogan_fr || 'Premium IPTV Subscription service',
    brand: {
      '@type': 'Brand',
      name: settings?.brandName || 'IPTV Pro'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: schema.ratingValue || 4.8,
      reviewCount: schema.reviewCount || 15000,
      bestRating: 5,
      worstRating: 1
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: schema.priceCurrency || 'EUR',
      lowPrice: schema.priceMin || 6.99,
      highPrice: schema.priceMax || 39.99,
      offerCount: 4
    }
  } : null

  // Structured Data 3: WebSite
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings?.brandName || 'IPTV Pro',
    url: publicUrl(domain, locale),
    inLanguage: 'es-ES',
  }

  // We only add navigation links for main content modules
  const navModuleIds = [
    'features',
    'pricing',
    'how_it_works',
    'nos_services',
    'content',
    'devices',
    'testimonials',
    'temoignages',
    'faq',
    'affiliate_links'
  ]

  // Filter and sort modules using same visibility/sorting rules as the homepage
  const visibleNavModules = pageModules
    .filter((m) => m.isVisible_es)
    .filter((m) => navModuleIds.includes(m.id))
    .sort((a, b) => a.sortOrder_es - b.sortOrder_es)

  // Query titles from database
  const moduleTitles = await db.moduleContent.findMany({
    where: {
      locale,
      key: 'title',
      moduleId: { in: navModuleIds }
    }
  })
  const titleMap = Object.fromEntries(moduleTitles.map(t => [t.moduleId, t.value]))

  const homePath = '/'

  const dynamicLinks = [
    { href: '/#hero', label: 'Inicio' },
    { href: '/#pricing', label: 'Precio' },
    { href: '/blog', label: 'Blog' },
    { href: '/#footer', label: 'Nosotros' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/#footer', label: 'Contacto' },
  ]

  // Parse header links from DB content
  const headerLinks: { href: string; label: string; target?: string; rel?: string }[] = []
  for (let i = 1; i <= 6; i++) {
    const val = headerC[`nav_link_${i}`]
    if (val) {
      const parsed = parseButtonValue(val)
      if (parsed && parsed.text.trim()) {
        const props = getButtonLinkProps(parsed, locale, settings)
        headerLinks.push({
          href: props.href || '#',
          label: parsed.text,
          target: props.target,
          rel: props.rel,
        })
      }
    }
  }

  const finalLinks = headerLinks.length > 0 ? headerLinks : dynamicLinks

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={buildFontHref(font)} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body, button, input, select, textarea {
            font-family: '${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
        `}} />
        {orgSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        )}
        {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {settings?.analyticsHead && parseHTMLToReact(settings.analyticsHead)}
      </head>
      <body>
        <div className={editMode ? 'edit-mode' : ''}>
          {editMode && <EditToolbar locale={locale} />}
          <NavBar
            locale={locale}
            settings={settings}
            isEditMode={editMode}
            links={finalLinks}
            headerContent={headerC}
          />
          <main>
            {children}
          </main>
          <Footer
            locale={locale}
            settings={settings}
            isEditMode={editMode}
            footerContent={footerC}
            navLinks={finalLinks}
          />
          <SupportWidgets
            locale={locale}
            whatsappNumber={settings?.whatsappNumber ?? ''}
            whatsappMsg={settings?.whatsappMsg_es ?? ''}
            telegramUrl={settings?.telegramUrl ?? ''}
            supportPopupDelay={settings?.supportPopupDelay ?? 5}
            content={supportC}
            isEditMode={editMode}
            showSupportWidget={settings?.showSupportWidget !== false}
          />
        </div>
        {settings?.analyticsBody && (
          <div dangerouslySetInnerHTML={{ __html: settings.analyticsBody }} />
        )}
      </body>
    </html>
  )
}
