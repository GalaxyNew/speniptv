'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: '📊 仪表盘', exact: true },
  { href: '/admin/projects', label: '📋 项目任务板' },
  { href: '/admin/release', label: '🚀 发布中心' },
  { href: '/admin/modules', label: '📦 模块管理' },
  { href: '/admin/content', label: '✏️ 内容编辑' },
  { href: '/admin/subpages', label: '📄 页面管理' },
  { href: '/admin/blog-posts', label: '📰 文章管理' },
  { href: '/admin/blog-templates', label: '🗂️ 模板管理' },
  { href: '/admin/pricing', label: '💰 定价管理' },
  { href: '/admin/affiliate-links', label: '🔗 推广链接' },
  { href: '/admin/seo', label: '🔍 SEO 设置' },
  { href: '/admin/personalized', label: '🎨 个性设置' },
  { href: '/admin/settings', label: '⚙️ 系统设置' },
]


export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 240,
        background: '#1e293b',
        borderRight: '1px solid rgba(148,163,184,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid rgba(148,163,184,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {!collapsed && (
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              IPTV Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1.125rem',
              padding: '0.25rem',
              flexShrink: 0,
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.25rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#22d3ee' : '#94a3b8',
                  background: active ? 'rgba(34,211,238,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.label.split(' ')[0]}</span>
                {!collapsed && <span>{item.label.split(' ').slice(1).join(' ')}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer: Preview + Logout */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
          <a
            href="/api/admin/edit-mode?to=/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '0.25rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              color: '#22d3ee',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <span>👁️</span>
            {!collapsed && <span>查看前台</span>}
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#64748b',
              width: '100%',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <span>🚪</span>
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
