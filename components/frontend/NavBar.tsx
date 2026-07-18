'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseButtonValue, getButtonLinkProps } from '@/lib/button'

interface NavBarProps {
  locale: string
  settings: any
  isEditMode: boolean
  links?: { href: string; label: string; target?: string; rel?: string }[]
  headerContent?: Record<string, string>
}

const navLinks = {
  fr: [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#pricing', label: 'Tarifs' },
    { href: '#faq', label: 'FAQ' },
  ],
  es: [
    { href: '#hero', label: 'Inicio' },
    { href: '#pricing', label: 'Precio' },
    { href: '/blog', label: 'Blog' },
    { href: '/nosotros', label: 'Nosotros' },
    { href: '#faq', label: 'FAQ' },
    { href: '#footer', label: 'Contacto' },
  ],
  en: [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ],
  zh: [
    { href: '#features', label: '产品特性' },
    { href: '#pricing', label: '价格套餐' },
    { href: '#faq', label: '常见问题' },
  ],
}

const ctaLabels = { fr: 'Essai Gratuit', es: 'Prueba', en: 'Free Trial', zh: '免费试用' }

export default function NavBar({ locale, settings, isEditMode, links: propLinks, headerContent }: NavBarProps) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const isSubpage = pathname !== '/' && !/^\/(fr|es|en|zh)\/?$/.test(pathname)
  const isBlogPage = pathname === '/blog' || pathname.startsWith('/blog/') || /^\/(fr|es|en|zh)\/blog(\/|$)/.test(pathname)
  const backLabels = { fr: 'Retour', es: 'Volver', en: 'Back', zh: '返回上一页' }
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check if there is a referrer from the same domain
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    
    if (referrer && referrer.startsWith(currentOrigin)) {
      window.history.back()
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      if (isBlogPage) {
        window.location.href = locale === 'es' ? '/blog' : `/${locale}/blog`
      } else {
        window.location.href = locale === 'es' ? '/' : `/${locale}`
      }
    }
  }
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const useLightNav = isSubpage || scrolled
  const loc = (locale as keyof typeof navLinks) in navLinks ? locale as keyof typeof navLinks : 'en'
  const links = propLinks || navLinks[loc] || []
  
  const isDefaultLocale = locale === (settings?.defaultLocale ?? 'fr')
  const homePath = isDefaultLocale ? '/' : `/${locale}`

  let displayLinks = links
  if (isSubpage) {
    displayLinks = links
      .filter((link: any) => {
        const href = link.href || ''
        const label = (link.label || '').toLowerCase()
        
        const isRemovedSection =
          href.includes('#pricing') ||
          href.includes('#faq') ||
          href.includes('#features') ||
          href.includes('#how_it_works') ||
          href.includes('#nos_services') ||
          href.includes('#devices') ||
          href.includes('#testimonials') ||
          href.includes('#temoignages') ||
          href.includes('#content') ||
          href.includes('#affiliate_links')
          
        const isRemovedKeyword =
          label.includes('precio') || label.includes('tarif') || label.includes('pricing') || label.includes('价格') ||
          label.includes('faq') || label.includes('常见问题') ||
          label.includes('feature') || label.includes('fonctionnalité') || label.includes('产品特性') || label.includes('特性') ||
          label.includes('service') || label.includes('服务') ||
          label.includes('comment') || label.includes('cómo') || label.includes('how') || label.includes('工作流程') || label.includes('使用步骤') ||
          label.includes('device') || label.includes('dispositivo') || label.includes('设备') ||
          label.includes('testimonial') || label.includes('testimonio') || label.includes('口碑') || label.includes('评价') ||
          label.includes('partner') || label.includes('partenaire') || label.includes('合作')

        return !isRemovedSection && !isRemovedKeyword
      })
      .map((link: any) => {
        let href = link.href || ''
        if (href.startsWith('#')) {
          href = homePath === '/' ? `/${href}` : `${homePath}${href}`
        }
        return {
          ...link,
          href,
        }
      })
  }

  const waNumber = settings?.whatsappNumber ?? ''
  const waMsg = settings?.[`whatsappMsg_${locale}`] ?? ''
  const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`

  const brandName = settings?.brandName || 'IPTV Pro'

  // CTA Button
  const rawCta = headerContent?.cta_text
  const ctaParsed = rawCta ? parseButtonValue(rawCta) : null
  const ctaProps = ctaParsed && ctaParsed.text.trim() ? getButtonLinkProps(ctaParsed, locale, settings) : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  useEffect(() => {
    // 1. Check for sessionStorage scroll target
    try {
      const scrollTarget = sessionStorage.getItem('scrollTarget')
      if (scrollTarget) {
        sessionStorage.removeItem('scrollTarget')
        const scrollToElement = () => {
          const element = document.getElementById(scrollTarget)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
            return true
          }
          return false
        }
        if (!scrollToElement()) {
          const timer = setTimeout(scrollToElement, 150)
          return () => clearTimeout(timer)
        }
      }
    } catch (err) {
      console.error(err)
    }

    // 2. Fallback in case they access the page directly with hash in the URL (e.g. external link)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1)
      
      try {
        window.history.replaceState(
          null,
          document.title,
          window.location.pathname + window.location.search
        )
      } catch (err) {
        console.error('Failed to replace hash:', err)
      }

      const scrollToElement = () => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
          return true
        }
        return false
      }

      if (!scrollToElement()) {
        const timer = setTimeout(scrollToElement, 150)
        return () => clearTimeout(timer)
      }
    }
  }, [pathname])

  return (
    <nav
      className={`${scrolled ? 'scrolled-nav' : ''} ${useLightNav ? 'subpage-nav' : 'home-nav'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: useLightNav ? 'var(--bg-nav)' : 'transparent',
        borderBottom: useLightNav ? '1px solid var(--nav-border)' : 'none',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 1.5rem',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, position: 'relative' }}>
        {/* Left Side: Mobile Menu Button & Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: menuOpen 
                ? (useLightNav ? 'var(--text-primary)' : '#ffffff') 
                : (useLightNav ? 'var(--text-primary)' : 'var(--accent-1, #22d3ee)'),
              cursor: 'pointer',
              padding: '0.5rem',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo / Brand */}
          <a className="nav-logo" href={locale === 'es' ? '/' : `/${locale}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            {settings?.brandLogoUrl ? (
              <img src={settings.brandLogoUrl} alt={settings.brandName} style={{ height: 36, objectFit: 'contain' }} />
            ) : (
              <span style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                fontFamily: 'Outfit, Inter, sans-serif',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {brandName}
              </span>
            )}
          </a>
        </div>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          {displayLinks.map((link: any, idx) => (
            <a
              key={`${link.href}-${idx}`}
              href={link.href}
              target={link.target}
              rel={link.rel}
              onClick={(e) => handleAnchorClick(e, link.href)}
              style={{
                color: 'var(--nav-link)',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: 500,
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--nav-link-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--nav-link)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Language Switcher + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isSubpage ? (
            <>
              {/* Desktop CTA */}
              <div className="desktop-cta-btn">
                {ctaProps ? (
                  <a
                    href={isSubpage && ctaProps.href?.startsWith('#') ? (homePath === '/' ? `/${ctaProps.href}` : `${homePath}${ctaProps.href}`) : ctaProps.href}
                    target={ctaProps.target}
                    rel={ctaProps.rel}
                    onClick={handleAnchorClick}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                  >
                    {ctaParsed?.text}
                  </a>
                ) : (
                  <a
                    href={isSubpage ? (homePath === '/' ? '/#trial_cta' : `${homePath}#trial_cta`) : '#trial_cta'}
                    onClick={handleAnchorClick}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                  >
                    {ctaLabels[loc]}
                  </a>
                )}
              </div>
              
              {/* Mobile Back Button */}
              <div className="mobile-only-back">
                <button
                  onClick={handleBack}
                  style={{ 
                    padding: '0.4rem 0.5rem', 
                    fontSize: '0.9rem', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--accent-1, #22d3ee)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: 'none',
                  }}
                >
                  ← {backLabels[loc as keyof typeof backLabels] || backLabels.en}
                </button>
              </div>
            </>
          ) : (
            <>
              {ctaProps ? (
                <a
                  href={isSubpage && ctaProps.href?.startsWith('#') ? (homePath === '/' ? `/${ctaProps.href}` : `${homePath}${ctaProps.href}`) : ctaProps.href}
                  target={ctaProps.target}
                  rel={ctaProps.rel}
                  onClick={handleAnchorClick}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                >
                  {ctaParsed?.text}
                </a>
              ) : (
                <a
                  href={isSubpage ? (homePath === '/' ? '/#trial_cta' : `${homePath}#trial_cta`) : '#trial_cta'}
                  onClick={handleAnchorClick}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                >
                  {ctaLabels[loc]}
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div
          className="mobile-dropdown-menu"
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            right: 0,
            background: useLightNav ? 'var(--bg-nav)' : 'rgba(0, 0, 0, 0.9)',
            borderBottom: useLightNav 
              ? '1px solid var(--nav-border)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 99,
          }}
        >
          {displayLinks.map((link: any, idx) => (
            <a
              key={`${link.href}-${idx}`}
              href={link.href}
              target={link.target}
              rel={link.rel}
              onClick={(e) => {
                setMenuOpen(false)
                handleAnchorClick(e, link.href)
              }}
              style={{
                color: useLightNav ? 'var(--text-primary)' : '#ffffff',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '0.5rem 0',
                borderBottom: useLightNav 
                  ? '1px solid var(--nav-border)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--nav-link-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = useLightNav ? 'var(--text-primary)' : '#ffffff')}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        .mobile-only-back {
          display: none;
        }
        .mobile-only-back button {
          border: none !important;
          background: transparent !important;
          color: var(--accent-1, #22d3ee) !important;
          box-shadow: none !important;
          outline: none !important;
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-cta-btn { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .nav-logo {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
          .mobile-only-back {
            display: block !important;
          }
        }
        .home-nav .mobile-dropdown-menu a {
          color: #ffffff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .home-nav .mobile-dropdown-menu a:hover {
          color: var(--nav-link-hover) !important;
        }
        .subpage-nav .mobile-dropdown-menu a {
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--nav-border) !important;
        }
        .subpage-nav .mobile-dropdown-menu a:hover {
          color: var(--nav-link-hover) !important;
        }
      `}</style>
    </nav>
  )
}
