'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { parseButtonValue, getButtonLinkProps } from '@/lib/button'

interface FooterProps {
  locale: string
  settings: any
  isEditMode: boolean
  footerContent?: Record<string, string>
  navLinks?: { href: string; label: string; target?: string; rel?: string }[]
}
interface AffiliateLink { id: string; title: string; url: string }

const content = {
  fr: {
    desc: 'Le service IPTV premium pour toute l\'Europe. Qualité HD & 4K, +26 000 chaînes, support 24/7.',
    links: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    contact: 'Nous contacter',
    rights: 'Tous droits réservés.',
    affiliateTitle: 'Nos Partenaires',
    legalTitle: 'Légal',
    legalLinks: [
      { label: 'Politique de confidentialité', href: '/fr/privacy-policy' },
      { label: "Conditions d'utilisation", href: '/fr/terms-of-service' },
      { label: 'Politique de remboursement', href: '/fr/refund-policy' },
    ],
  },
  es: {
    desc: 'El servicio IPTV premium para toda Europa. Calidad HD y 4K, +26 000 canales, soporte 24/7.',
    links: [
      { label: 'Características', href: '#features' },
      { label: 'Precios', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    contact: 'Contáctanos',
    rights: 'Todos los derechos reservados.',
    affiliateTitle: 'Nuestros Socios',
    legalTitle: 'Legal',
    legalLinks: [
      { label: 'política de privacidad', href: '/privacy-policy' },
      { label: 'Condiciones de servicio', href: '/terms-of-service' },
      { label: 'Política de reembolso', href: '/refund-policy' },
    ],
  },
  en: {
    desc: 'The premium IPTV service for all of Europe. HD & 4K quality, 26,000+ channels, 24/7 support.',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    contact: 'Contact us',
    rights: 'All rights reserved.',
    affiliateTitle: 'Our Partners',
    legalTitle: 'Legal',
    legalLinks: [
      { label: 'Privacy Policy', href: '/en/privacy-policy' },
      { label: 'Terms of Service', href: '/en/terms-of-service' },
      { label: 'Refund Policy', href: '/en/refund-policy' },
    ],
  },
  zh: {
    desc: '面向全欧洲的优质 IPTV 服务。超高清 HD & 4K 画质，26,000+ 频道，24/7 客服支持。',
    links: [
      { label: '产品特性', href: '#features' },
      { label: '价格套餐', href: '#pricing' },
      { label: '常见问题', href: '#faq' },
    ],
    contact: '联系我们',
    rights: '保留所有权利。',
    affiliateTitle: '合作伙伴',
    legalTitle: '法律政策',
    legalLinks: [
      { label: '隐私政策', href: '/zh/privacy-policy' },
      { label: '服务条款', href: '/zh/terms-of-service' },
      { label: '退款政策', href: '/zh/refund-policy' },
    ],
  },
}

export default function Footer({ locale, settings, isEditMode, footerContent, navLinks }: FooterProps) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const loc = locale as keyof typeof content
  const d = content[loc] ?? content.en
  const year = new Date().getFullYear()
  const brand = settings?.brandName ?? 'IPTV Pro'
  
  let waNumber = settings?.whatsappNumber ?? ''
  
  const waMsg = settings?.[`whatsappMsg_${locale}`] ?? ''
  const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`
  const rawTelegramUrl = settings?.telegramUrl ?? ''
  const telegramUrl = rawTelegramUrl
    ? (rawTelegramUrl.startsWith('http')
        ? rawTelegramUrl
        : (rawTelegramUrl.startsWith('t.me')
            ? `https://${rawTelegramUrl}`
            : `https://t.me/${rawTelegramUrl.replace('@', '')}`))
    : ''
  const email = settings?.contactEmail ?? ''

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    const targetHref = href || e.currentTarget.getAttribute('href') || ''
    if (!targetHref) return

    // 1. If it's a pure anchor on the current page
    if (targetHref.startsWith('#')) {
      const targetId = targetHref.substring(1)
      const element = document.getElementById(targetId)
      if (element) {
        e.preventDefault()
        element.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }

    // 2. If it contains a '#' (e.g. '/#pricing' or '/es#pricing')
    if (targetHref.includes('#')) {
      const [urlPath, hash] = targetHref.split('#')
      
      // Normalize current path and target path to compare them
      const normalizePath = (p: string) => p.replace(/\/$/, '') || '/'
      const currentNorm = normalizePath(pathname)
      const targetNorm = normalizePath(urlPath)
      
      // Treat locale roots (e.g. '/es', '/fr', etc.) as equivalent to '/' (or home page)
      const isHomePath = (p: string) => p === '/' || /^\/(fr|es|en|zh)$/.test(p)
      
      const isSamePage = currentNorm === targetNorm || (isHomePath(currentNorm) && isHomePath(targetNorm))
      
      if (isSamePage) {
        const element = document.getElementById(hash)
        if (element) {
          e.preventDefault()
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        // Cross-page navigation: intercept, store scroll target in sessionStorage, and navigate without hash!
        e.preventDefault()
        try {
          sessionStorage.setItem('scrollTarget', hash)
        } catch (err) {
          console.error(err)
        }
        router.push(urlPath)
      }
    }
  }

  const copyright = (settings?.footerCopyright ?? '© {year} {brand}. All rights reserved.')
    .replace('{year}', String(year))
    .replace('{brand}', brand)

  const brandDesc = footerContent?.description || d.desc
  const copyrightText = footerContent?.copyright
    ? footerContent.copyright.replace('{year}', String(year)).replace('{brand}', brand)
    : copyright

  // Legal links
  const dbFooterLinks: { label: string; href: string; target?: string; rel?: string }[] = []
  if (footerContent) {
    for (let i = 1; i <= 4; i++) {
      const rawLink = footerContent[`footer_link_${i}`]
      if (rawLink) {
        const parsed = parseButtonValue(rawLink)
        if (parsed && parsed.text.trim()) {
          const props = getButtonLinkProps(parsed, locale, settings)
          dbFooterLinks.push({
            href: props.href || '#',
            label: parsed.text,
            target: props.target,
            rel: props.rel,
          })
        }
      }
    }
  }

  const legalLinks = dbFooterLinks.length > 0 ? dbFooterLinks : d.legalLinks
  const footerNavLinks = navLinks && navLinks.length > 0 ? navLinks : d.links

  // Note: Affiliate links are now rendered as a standalone homepage module (AffiliateLinksSection).


  return (
    <footer id="footer" style={{ background: 'var(--bg-footer)', color: 'var(--footer-text)', padding: '3rem 0 1.5rem' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr 1.2fr',
          gap: '3rem',
          marginBottom: '2.5rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontSize: '1.375rem',
              fontWeight: 800,
              fontFamily: 'Outfit, Inter, sans-serif',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}>
              {brand}
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--footer-text)', maxWidth: 300 }}>
              {brandDesc}
            </p>
          </div>

          {/* Nav links */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--footer-link)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Navigation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: 0, margin: 0 }}>
              {footerNavLinks.map((link: any, i) => (
                <li key={i}>
                  <a href={link.href} target={link.target} rel={link.rel} onClick={(e) => handleAnchorClick(e, link.href)} style={{ color: 'var(--footer-text)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                    onMouseEnter={(e: any) => e.target.style.color = 'var(--accent-1)'}
                    onMouseLeave={(e: any) => e.target.style.color = 'var(--footer-text)'}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--footer-link)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d.legalTitle}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', padding: 0, margin: 0 }}>
              {legalLinks.map((link: any, i) => {
                const href = (link.href || '').startsWith('/es/') && !footerContent
                  ? link.href.substring(3)
                  : link.href
                return (
                  <li key={i}>
                    <a href={href} target={link.target} rel={link.rel} style={{ color: 'var(--footer-text)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                      onMouseEnter={(e: any) => e.target.style.color = 'var(--accent-1)'}
                      onMouseLeave={(e: any) => e.target.style.color = 'var(--footer-text)'}
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Contact info (WhatsApp, Telegram, Email) */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--footer-link)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d.contact}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {waNumber && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--footer-text)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e: any) => e.target.style.color = 'var(--accent-1)'}
                  onMouseLeave={(e: any) => e.target.style.color = 'var(--footer-text)'}
                >
                  💬 WhatsApp  {waNumber.startsWith('+') ? waNumber : `+${waNumber}`}
                </a>
              )}
              {telegramUrl && (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--footer-text)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e: any) => e.target.style.color = 'var(--accent-1)'}
                  onMouseLeave={(e: any) => e.target.style.color = 'var(--footer-text)'}
                >
                  ✈️ Telegram
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}
                  style={{ color: 'var(--footer-text)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e: any) => e.target.style.color = 'var(--accent-1)'}
                  onMouseLeave={(e: any) => e.target.style.color = 'var(--footer-text)'}
                >
                  📧 {email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', width: '100%', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--footer-text)', width: '100%' }}>{copyrightText}</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          footer .container > div:first-child { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 600px) {
          footer .container > div:first-child { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>
    </footer>
  )
}
