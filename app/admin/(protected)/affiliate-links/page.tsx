'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

const LOCALES = ['fr', 'es', 'en', 'zh']

interface AffiliateLink {
  id: string
  title: string
  subtitle: string
  url: string
  locale: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

const emptyForm = { title: '', subtitle: '', url: '', locale: 'fr', sortOrder: 0, isActive: true }

export default function AffiliateLinksPage() {
  const { showPermissionAlert } = usePermission()
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [filterLocale, setFilterLocale] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    const q = filterLocale !== 'all' ? `?locale=${filterLocale}` : ''
    const res = await fetch(`/api/admin/affiliate-links${q}`)
    const data = await res.json()
    setLinks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterLocale])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(link: AffiliateLink) {
    setEditingId(link.id)
    setForm({ title: link.title, subtitle: link.subtitle || '', url: link.url, locale: link.locale, sortOrder: link.sortOrder, isActive: link.isActive })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) { setError('标题和链接不能为空'); return }
    setSaving(true)
    setError('')
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/admin/affiliate-links/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch('/api/admin/affiliate-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      if (res.status === 403) {
        setError('当前无权限修改，请联系管理员！')
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || '保存失败，请重试')
        return
      }
      setShowForm(false)
      fetchLinks()
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除此推广链接？')) return
    const res = await fetch(`/api/admin/affiliate-links/${id}`, { method: 'DELETE' })
    if (res.status === 403) {
      showPermissionAlert()
    } else if (!res.ok) {
      alert('删除失败，请重试')
    } else {
      fetchLinks()
    }
  }

  async function toggleActive(link: AffiliateLink) {
    const res = await fetch(`/api/admin/affiliate-links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    })
    if (res.status === 403) {
      showPermissionAlert()
    } else if (!res.ok) {
      alert('操作失败，请重试')
    } else {
      fetchLinks()
    }
  }

  const localeBadgeColor: Record<string, string> = {
    fr: '#3B82F6', es: '#10B981', en: '#F59E0B', zh: '#EC38BC',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #6366f1)' }}>🔗 推广链接管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>管理各语言版本 Footer 底部的推广链接</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--accent-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))',
          color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          ＋ 添加链接
        </button>
      </div>

      {/* Locale Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', ...LOCALES].map(l => (
          <button key={l} onClick={() => setFilterLocale(l)} style={{
            padding: '0.375rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '2px solid',
            borderColor: filterLocale === l ? 'var(--accent-1, #6366f1)' : 'rgba(148,163,184,0.25)',
            background: filterLocale === l ? 'var(--accent-1, #6366f1)' : 'transparent',
            color: filterLocale === l ? '#fff' : '#94a3b8',
            transition: 'all 0.2s',
          }}>
            {l === 'all' ? '全部' : l}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>加载中…</div>
      ) : links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', borderRadius: 12, border: '2px dashed rgba(148,163,184,0.2)' }}>
          暂无推广链接，点击右上角「添加链接」开始添加
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.15)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                {['排序', '语言', '标题', '链接', '状态', '操作'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((link, i) => (
                <tr key={link.id} style={{ borderTop: '1px solid rgba(148,163,184,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontWeight: 700 }}>{link.sortOrder}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                      background: `${localeBadgeColor[link.locale] ?? '#6366f1'}22`,
                      color: localeBadgeColor[link.locale] ?? '#6366f1',
                      textTransform: 'uppercase',
                    }}>
                      {link.locale}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
                    <div>{link.title}</div>
                    {link.subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginTop: '0.125rem' }}>{link.subtitle}</div>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', maxWidth: 220 }}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {link.url}
                    </a>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button onClick={() => toggleActive(link)} style={{
                      padding: '0.25rem 0.75rem', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: '0.75rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: link.isActive ? '#10B98122' : '#EF444422',
                      color: link.isActive ? '#10B981' : '#EF4444',
                    }}>
                      {link.isActive ? '● 启用' : '○ 禁用'}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(link)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>编辑</button>
                      <button onClick={() => handleDelete(link.id)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480,
            border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-1, #6366f1)' }}>
              {editingId ? '✏️ 编辑链接' : '＋ 添加推广链接'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Locale */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>语言</label>
                <select value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))} style={{
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                  background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                  outline: 'none', cursor: 'pointer',
                }}>
                  {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()} – {l === 'fr' ? '法语' : l === 'es' ? '西班牙语' : l === 'en' ? '英语' : '中文'}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>标题</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例：IPTV 合作伙伴" style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              {/* Subtitle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>副标题</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="例：点击访问官方合作站点" style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              {/* URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>推广链接 URL</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/ref=xxx" type="url" style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              {/* Sort Order */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>排序值（越小越靠前）</label>
                <input value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  type="number" min={0} style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              {/* isActive */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#6366f1' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>启用（在前端显示）</span>
              </label>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: '0.625rem 1.25rem', borderRadius: 9, border: '1px solid rgba(148,163,184,0.25)',
                background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '0.625rem 1.5rem', borderRadius: 9, border: 'none',
                background: 'var(--accent-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))',
                color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
              }}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
