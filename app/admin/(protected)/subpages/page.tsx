'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

const LOCALES = ['es']

interface Subpage {
  id: string
  title: string
  slug: string
  locale: string
  content: string
  isVisible: boolean
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  robots: string
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  title: '',
  slug: '',
  locale: 'es',
  content: '',
  isVisible: true,
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index, follow',
}

export default function SubpagesPage() {
  const { showPermissionAlert } = usePermission()
  const [subpages, setSubpages] = useState<Subpage[]>([])
  const [filterLocale, setFilterLocale] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchSubpages = useCallback(async () => {
    setLoading(true)
    const q = filterLocale !== 'all' ? `?locale=${filterLocale}` : ''
    const res = await fetch(`/api/admin/subpages${q}`)
    const data = await res.json()
    setSubpages(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterLocale])

  useEffect(() => {
    fetchSubpages()
  }, [fetchSubpages])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(page: Subpage) {
    setEditingId(page.id)
    setForm({
      title: page.title,
      slug: page.slug,
      locale: page.locale,
      content: page.content,
      isVisible: page.isVisible,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      canonicalUrl: page.canonicalUrl || '',
      robots: page.robots || 'index, follow',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      setError('页面名称和链接别名 (Slug) 不能为空')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/subpages/${editingId}` : '/api/admin/subpages'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      const resData = await res.json()
      if (res.status === 403) {
        throw new Error('当前无权限修改，请联系管理员！')
      }
      if (!res.ok) {
        throw new Error(resData.error || '保存失败')
      }

      setShowForm(false)
      fetchSubpages()
    } catch (err: any) {
      setError(err.message || '保存失败，请检查数据重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要永久删除这个页面吗？')) return
    const res = await fetch(`/api/admin/subpages/${id}`, { method: 'DELETE' })
    if (res.status === 403) {
      showPermissionAlert()
    } else if (!res.ok) {
      alert('删除失败，请重试')
    } else {
      fetchSubpages()
    }
  }

  async function toggleVisible(page: Subpage) {
    const res = await fetch(`/api/admin/subpages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !page.isVisible }),
    })
    if (res.status === 403) {
      showPermissionAlert()
    } else if (!res.ok) {
      alert('操作失败，请重试')
    } else {
      fetchSubpages()
    }
  }

  const localeBadgeColor: Record<string, string> = {
    fr: '#3B82F6', es: '#10B981', en: '#F59E0B', zh: '#EC38BC',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>📄 页面管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>新建和维护网站中的自定义文章、条规政策以及其他独立页面</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
          color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          ＋ 新建页面
        </button>
      </div>

      {/* Locale Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', ...LOCALES].map(l => (
          <button key={l} onClick={() => setFilterLocale(l)} style={{
            padding: '0.375rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
            border: '2px solid',
            borderColor: filterLocale === l ? 'var(--accent-1, #22d3ee)' : 'rgba(148,163,184,0.25)',
            background: filterLocale === l ? 'var(--accent-1, #22d3ee)' : 'transparent',
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
      ) : subpages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', borderRadius: 12, border: '2px dashed rgba(148,163,184,0.2)' }}>
          暂无自定义页面，点击右上角「新建页面」开始创建
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.15)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(34,211,238,0.08)' }}>
                {['页面标题', 'URL 路径', '语言', '状态', '更新时间', '操作'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subpages.map((page, i) => (
                <tr key={page.id} style={{ borderTop: '1px solid rgba(148,163,184,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
                    {page.title}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <a href={`/${page.locale}/${page.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '0.85rem' }}>
                      /{page.locale}/{page.slug}
                    </a>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                      background: `${localeBadgeColor[page.locale] ?? '#22d3ee'}22`,
                      color: localeBadgeColor[page.locale] ?? '#22d3ee',
                      textTransform: 'uppercase',
                    }}>
                      {page.locale}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button onClick={() => toggleVisible(page)} style={{
                      padding: '0.25rem 0.75rem', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: '0.75rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: page.isVisible ? '#10B98122' : '#EF444422',
                      color: page.isVisible ? '#10B981' : '#EF4444',
                    }}>
                      {page.isVisible ? '● 启用' : '○ 禁用'}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(page.updatedAt).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(page)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(34,211,238,0.4)',
                        background: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>编辑</button>
                      <button onClick={() => handleDelete(page.id)} style={{
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
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 780,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box'
          }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-1, #22d3ee)' }}>
              {editingId ? '✏️ 编辑页面' : '＋ 新建子页面'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Left Column: Content Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>页面标题</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="例：关于我们" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>链接别名 (Slug)</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="例：about-us" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    预览地址：/{form.locale}/{form.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>所属语言</label>
                  <select value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))} style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', cursor: 'pointer',
                  }}>
                    {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()} – {l === 'fr' ? '法语' : l === 'es' ? '西班牙语' : l === 'en' ? '英语' : '中文'}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>页面内容 (支持 HTML/Markdown 文本)</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="请输入页面正文内容，可以使用 HTML 标签，如 <p>、<h1> 等..." rows={8} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace'
                    }} />
                </div>
              </div>

              {/* Right Column: SEO Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(15,23,42,0.2)', padding: '1.25rem', borderRadius: 10, border: '1px solid rgba(148,163,184,0.05)' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  🔍 该页面 SEO 专属配置
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO 标题 (Meta Title)</label>
                  <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                    placeholder="留空则默认使用页面标题" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO 描述 (Meta Description)</label>
                  <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                    placeholder="请输入页面摘要描述（建议 150 字以内）" rows={3} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box', resize: 'none'
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>规范化链接 (Canonical URL)</label>
                  <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                    placeholder="留空则自动生成当前 URL" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>爬虫指令 (Robots)</label>
                  <select value={form.robots} onChange={e => setForm(f => ({ ...f, robots: e.target.value }))} style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', cursor: 'pointer',
                  }}>
                    <option value="index, follow">index, follow (允许索引且跟踪)</option>
                    <option value="noindex, nofollow">noindex, nofollow (禁止索引和跟踪)</option>
                    <option value="noindex, follow">noindex, follow (禁止索引但跟踪链接)</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22d3ee' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>发布状态（在前端公开访问）</span>
                </label>
              </div>
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>⚠️ {error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: '0.625rem 1.25rem', borderRadius: 9, border: '1px solid rgba(148,163,184,0.25)',
                background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}>取消</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '0.625rem 1.5rem', borderRadius: 9, border: 'none',
                background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
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
