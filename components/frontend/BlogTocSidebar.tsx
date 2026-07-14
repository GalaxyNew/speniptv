'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface BlogTocSidebarProps {
  toc: TocItem[]
  titleLabel?: string
}

export default function BlogTocSidebar({ toc, titleLabel = 'Indice' }: BlogTocSidebarProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  useEffect(() => {
    if (toc.length === 0) return

    const handleScroll = () => {
      let currentActive = toc[0].id
      
      for (const item of toc) {
        const el = document.getElementById(item.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // If the heading is above the top 150px of the viewport
          if (rect.top <= 150) {
            currentActive = item.id
          } else {
            break
          }
        }
      }
      
      setActiveId(currentActive)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // run once initially

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    setIsMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const offset = 120 // Header height offset
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = el.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  if (toc.length === 0) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Desktop & Mobile Responsive Rules */
        @media (max-width: 768px) {
          .blog-toc-sidebar {
            display: none !important;
          }
          .mobile-toc-trigger {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-toc-trigger, .mobile-toc-sheet, .mobile-toc-overlay {
            display: none !important;
          }
        }
      ` }} />

      {/* 1. Desktop Sidebar */}
      <aside className="blog-toc-sidebar" style={{
        position: 'sticky',
        top: '120px',
        alignSelf: 'start',
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
        padding: '1.5rem',
        background: 'var(--bg-card, rgba(30, 41, 59, 0.4))',
        border: '1px solid var(--border-color, rgba(148, 163, 184, 0.12))',
        borderRadius: '1rem',
        backdropFilter: 'blur(8px)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h4 style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary, #94a3b8)',
          marginBottom: '1rem',
          marginTop: 0,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          paddingBottom: '0.5rem',
        }}>
          {titleLabel}
        </h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {toc.map((item) => {
            const isActive = activeId === item.id
            return (
              <li
                key={item.id}
                style={{
                  paddingLeft: item.level === 3 ? '1rem' : '0',
                  fontSize: item.level === 3 ? '0.85rem' : '0.9rem',
                  lineHeight: 1.4,
                }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(item.id, e)}
                  style={{
                    textDecoration: 'none',
                    color: isActive ? 'var(--accent-1, #22d3ee)' : 'var(--text-muted, #64748b)',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'color 0.2s',
                    display: 'inline-block',
                  }}
                >
                  {isActive && <span style={{ marginRight: '0.4rem', color: 'var(--accent-1, #22d3ee)' }}>✦</span>}
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* 2. Mobile Floating Circular Dot Trigger */}
      <button
        type="button"
        className="mobile-toc-trigger"
        onClick={() => setIsMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '32px',
          right: '24px',
          zIndex: 9997,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--accent-gradient, linear-gradient(90deg, #22d3ee, #a855f7))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(34, 211, 238, 0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          transition: 'transform 0.2s active',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>

      {/* 3. Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-toc-overlay"
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
          }}
        />
      )}

      {/* 4. Mobile Bottom Sheet Drawer */}
      <div
        className="mobile-toc-sheet"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1e293b',
          borderTop: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem',
          zIndex: 9999,
          maxHeight: '70vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          transform: isMobileOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '0.75rem' }}>
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#22d3ee',
            margin: 0,
          }}>
            {titleLabel}
          </h4>
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {toc.map((item) => {
            const isActive = activeId === item.id
            return (
              <li
                key={item.id}
                style={{
                  paddingLeft: item.level === 3 ? '1rem' : '0',
                  fontSize: item.level === 3 ? '0.85rem' : '0.95rem',
                  lineHeight: 1.4,
                }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(item.id, e)}
                  style={{
                    textDecoration: 'none',
                    color: isActive ? '#22d3ee' : '#94a3b8',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'color 0.2s',
                    display: 'block',
                    padding: '0.35rem 0',
                  }}
                >
                  {isActive && <span style={{ marginRight: '0.4rem', color: '#22d3ee' }}>✦</span>}
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
