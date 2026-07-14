'use client'

import { useState, createContext, useContext } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  exact?: boolean
  moduleKey: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/admin', label: '📊 仪表盘', exact: true, moduleKey: 'dashboard' },
  { href: '/admin/modules', label: '📦 模块管理', moduleKey: 'modules' },
  { href: '/admin/content', label: '✏️ 内容编辑', moduleKey: 'content' },
  { href: '/admin/subpages', label: '📄 页面管理', moduleKey: 'subpages' },
  { href: '/admin/blog-posts', label: '📰 文章管理', moduleKey: 'blog-posts' },
  { href: '/admin/blog-templates', label: '🗂️ 模板管理', moduleKey: 'blog-templates' },
  { href: '/admin/pricing', label: '💰 定价管理', moduleKey: 'pricing' },
  { href: '/admin/affiliate-links', label: '🔗 推广链接', moduleKey: 'affiliate-links' },
  { href: '/admin/seo', label: '🔍 SEO 设置', moduleKey: 'seo' },
  { href: '/admin/personalized', label: '🎨 个性设置', moduleKey: 'personalized' },
  { href: '/admin/settings', label: '⚙️ 系统设置', moduleKey: 'settings' },
  { href: '/admin/recycle-bin', label: '🗑️ 回收站', moduleKey: 'recycle-bin', adminOnly: true },
  { href: '/admin/accounts', label: '👤 账号管理', moduleKey: 'accounts', adminOnly: true },
  { href: '/admin/roles', label: '🔑 角色管理', moduleKey: 'roles', adminOnly: true },
  { href: '/admin/logs', label: '📋 操作日志', moduleKey: 'logs', adminOnly: true },
]

export const PermissionContext = createContext<{
  canEdit: boolean
  showPermissionAlert: () => void
}>({
  canEdit: true,
  showPermissionAlert: () => {},
})

export function usePermission() {
  return useContext(PermissionContext)
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [permissionAlertVisible, setPermissionAlertVisible] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        加载中...
      </div>
    )
  }

  const username = session?.user?.name
  const roleName = session?.user?.role
  const permissionsStr = session?.user?.permissions

  const isRootAdmin = username === 'admin' || roleName === 'admin'

  let permissionsObj: Record<string, string> = {}
  if (permissionsStr) {
    try {
      permissionsObj = JSON.parse(permissionsStr)
    } catch (e) {}
  }

  // Filter sidebar navigation items
  const allowedNavItems = navItems.filter((item) => {
    if (isRootAdmin) return true
    if (item.adminOnly) return false
    if (item.moduleKey === 'dashboard') return true
    const access = permissionsObj[item.moduleKey]
    return access === 'readonly' || access === 'edit'
  })

  // Determine permissions for the current page
  const currentItem = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )

  let isPageAuthorized = true
  let canEdit = true

  if (currentItem) {
    if (!isRootAdmin) {
      if (currentItem.adminOnly) {
        isPageAuthorized = false
      } else if (currentItem.moduleKey !== 'dashboard') {
        const access = permissionsObj[currentItem.moduleKey]
        isPageAuthorized = access === 'readonly' || access === 'edit'
        canEdit = access === 'edit'
      }
    }
  }

  if (!isPageAuthorized) {
    return <div style={{ padding: '2rem', color: '#94a3b8' }}>无权访问此页面</div>
  }

  return (
    <PermissionContext.Provider value={{ canEdit, showPermissionAlert: () => setPermissionAlertVisible(true) }}>
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
          {/* Nav */}
          <nav style={{ padding: '0.75rem 0.5rem', flex: 1, overflowY: 'auto' }}>
            {allowedNavItems.map((item) => {
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
      {permissionAlertVisible && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400,
            border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#f87171', fontSize: '1.25rem', fontWeight: 800 }}>⚠️ 操作受限</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              当前无权限修改，请联系管理员！
            </p>
            <button
              onClick={() => setPermissionAlertVisible(false)}
              style={{
                padding: '0.6rem 2rem', borderRadius: 8, border: 'none',
                background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </PermissionContext.Provider>
  )
}
