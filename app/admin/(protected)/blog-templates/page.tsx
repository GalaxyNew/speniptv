'use client'

import { useEffect, useState } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

interface BlogTemplate {
  id: string
  name: string
  headerContent: string
  footerContent: string
  anchorNavEnabled: boolean
  recommendationsType: string
  recommendationsCount: number
  keywordLinks: string
  isDefault?: boolean
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  name: '',
  headerContent: '',
  footerContent: '',
  anchorNavEnabled: true,
  recommendationsType: 'latest',
  recommendationsCount: 3,
  keywordLinksText: '', // for text UI editing (e.g. "Keyword | Url")
  isDefault: false,
}

export default function BlogTemplatesPage() {
  const { showPermissionAlert } = usePermission()
  const [templates, setTemplates] = useState<BlogTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [previewTpl, setPreviewTpl] = useState<BlogTemplate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog-templates')
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(tpl: BlogTemplate) {
    setEditingId(tpl.id)
    
    // Convert JSON keywordLinks back to text "Keyword | Url"
    let keywordLinksText = ''
    try {
      const mapping = JSON.parse(tpl.keywordLinks || '{}')
      keywordLinksText = Object.entries(mapping)
        .map(([k, v]) => `${k} | ${v}`)
        .join('\n')
    } catch (e) {
      keywordLinksText = ''
    }

    setForm({
      name: tpl.name,
      headerContent: tpl.headerContent,
      footerContent: tpl.footerContent,
      anchorNavEnabled: tpl.anchorNavEnabled,
      recommendationsType: tpl.recommendationsType,
      recommendationsCount: tpl.recommendationsCount,
      keywordLinksText,
      isDefault: tpl.isDefault || false,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('模板名称不能为空')
      return
    }

    // Convert "Keyword | Url" lines to JSON
    const mapping: Record<string, string> = {}
    const lines = form.keywordLinksText.split('\n')
    for (const line of lines) {
      const parts = line.split('|')
      if (parts.length >= 2) {
        const kw = parts[0].trim()
        const url = parts.slice(1).join('|').trim()
        if (kw && url) {
          mapping[kw] = url
        }
      }
    }
    const keywordLinks = JSON.stringify(mapping)

    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/blog-templates/${editingId}` : '/api/admin/blog-templates'
      const method = editingId ? 'PATCH' : 'POST'
      
      const payload = {
        name: form.name,
        headerContent: form.headerContent,
        footerContent: form.footerContent,
        anchorNavEnabled: form.anchorNavEnabled,
        recommendationsType: form.recommendationsType,
        recommendationsCount: form.recommendationsCount,
        keywordLinks,
        isDefault: form.isDefault,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const resData = await res.json()
      if (res.status === 403) {
        throw new Error('当前无权限修改，请联系管理员！')
      }
      if (!res.ok) {
        throw new Error(resData.error || '保存失败')
      }

      setShowForm(false)
      fetchTemplates()
    } catch (err: any) {
      setError(err.message || '保存失败，请检查数据重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个模板吗？使用该模板的文章将不再套用模板内容。')) return
    const res = await fetch(`/api/admin/blog-templates/${id}`, { method: 'DELETE' })
    if (res.status === 403) {
      showPermissionAlert()
    } else if (!res.ok) {
      alert('删除失败，请重试')
    } else {
      fetchTemplates()
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>🗂️ 模板管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>自定义博客文章模版，配置专属页头、页尾、文章推荐及关键词超链接映射</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
          color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          ＋ 新增模板
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>加载中…</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', borderRadius: 12, border: '2px dashed rgba(148,163,184,0.2)' }}>
          暂无自定义模板，点击右上角「新增模板」开始创建
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.15)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(34,211,238,0.08)' }}>
                {['模板名称', '页内锚点导航', '推荐配置', '自动链接词数', '创建时间', '操作'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl, i) => {
                let kwCount = 0
                try {
                  kwCount = Object.keys(JSON.parse(tpl.keywordLinks || '{}')).length
                } catch (e) {}

                return (
                  <tr key={tpl.id} style={{ borderTop: '1px solid rgba(148,163,184,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{tpl.name}</span>
                        {tpl.isDefault && (
                          <span style={{
                            padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700,
                            background: 'rgba(34,211,238,0.15)', color: '#22d3ee',
                          }}>
                            默认
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        background: tpl.anchorNavEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: tpl.anchorNavEnabled ? '#10B981' : '#EF4444',
                        whiteSpace: 'nowrap'
                      }}>
                        {tpl.anchorNavEnabled ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                      {tpl.recommendationsType === 'latest' ? '最新文章' : '同分类文章'} ({tpl.recommendationsCount}篇)
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#22d3ee', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {kwCount} 个词
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(tpl.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap' }}>
                        <button onClick={() => setPreviewTpl(tpl)} style={{
                          padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(168,85,247,0.4)',
                          background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}>预览</button>
                        <button onClick={() => openEdit(tpl)} style={{
                          padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(34,211,238,0.4)',
                          background: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}>编辑</button>
                        <button onClick={() => handleDelete(tpl.id)} style={{
                          padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}>删除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 780,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Close button */}
            <button type="button" onClick={() => setShowForm(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: '1.5rem', cursor: 'pointer', outline: 'none',
              transition: 'color 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
               onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              &times;
            </button>

            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-1, #22d3ee)' }}>
              {editingId ? '✏️ 编辑模版' : '＋ 新增文章模板'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>模板名称</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="例：标准指南模板" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>页头 HTML 内容</label>
                  <textarea value={form.headerContent} onChange={e => setForm(f => ({ ...f, headerContent: e.target.value }))}
                    placeholder="在文章正文顶部渲染的 HTML 标签，可用于横幅广告或提示语" rows={4} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace'
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>页尾 HTML 内容</label>
                  <textarea value={form.footerContent} onChange={e => setForm(f => ({ ...f, footerContent: e.target.value }))}
                    placeholder="在文章正文底部渲染的 HTML 标签，可用于免责声明或附加广告" rows={4} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace'
                    }} />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(15,23,42,0.2)', padding: '1.25rem', borderRadius: 10, border: '1px solid rgba(148,163,184,0.05)' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee' }}>⚙️ 模版功能选项</h3>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.anchorNavEnabled} onChange={e => setForm(f => ({ ...f, anchorNavEnabled: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22d3ee' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>启用页内锚点导航 (ToC)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22d3ee' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>设为默认模板 (新建文章时默认选择)</span>
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>推荐文章策略</label>
                  <select value={form.recommendationsType} onChange={e => setForm(f => ({ ...f, recommendationsType: e.target.value }))} style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', cursor: 'pointer',
                  }}>
                    <option value="latest">最新发布的文章</option>
                    <option value="category">相同类别下的最新文章</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>推荐文章篇数</label>
                  <input type="number" min={1} max={10} value={form.recommendationsCount} onChange={e => setForm(f => ({ ...f, recommendationsCount: parseInt(e.target.value) || 3 }))}
                    style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    关键词链接埋入 (每行一条)
                  </label>
                  <textarea value={form.keywordLinksText} onChange={e => setForm(f => ({ ...f, keywordLinksText: e.target.value }))}
                    placeholder="格式：关键词 | 目标链接&#10;例如：&#10;IPTV España | /es/#pricing&#10;IPTV Trial | https://wa.me/xxx" rows={5} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box', resize: 'vertical'
                    }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    当正文中出现对应的关键词时，系统会安全且自动地将其加为指定的链接。
                  </span>
                </div>
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

      {/* Template Preview Modal */}
      {previewTpl && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', padding: '2rem', boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1rem', background: '#1e293b', padding: '1rem 1.5rem', borderRadius: 12,
            border: '1px solid rgba(34,211,238,0.2)'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1.1rem', fontWeight: 800 }}>👁️ 模板效果预览: {previewTpl.name}</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>展示该模板包装的页头 HTML、页尾 HTML 布局排版</p>
            </div>
            <button onClick={() => setPreviewTpl(null)} style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
            }}>
              关闭预览
            </button>
          </div>

          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
            <iframe
              srcDoc={generateTemplatePreviewHtml(previewTpl.headerContent || '', previewTpl.footerContent || '')}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Template Live Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Client-side HTML Template Preview Compiler
function generateTemplatePreviewHtml(headerContent: string, footerContent: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Template Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      color: #94a3b8;
      font-family: Outfit, Inter, sans-serif;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .preview-container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 2.5rem;
      align-items: start;
    }
    .article-container {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 1.25rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    .article-header {
      padding: 2.5rem 2.5rem 1.5rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.08);
      background: linear-gradient(180deg, rgba(34, 211, 238, 0.03) 0%, transparent 100%);
    }
    .badge-category {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(34, 211, 238, 0.1);
      color: #22d3ee;
      border: 1px solid rgba(34, 211, 238, 0.2);
    }
    .article-title {
      font-size: 2.2rem;
      font-weight: 900;
      color: #f1f5f9;
      line-height: 1.25;
      margin: 15px 0 0;
    }
    .article-content {
      padding: 2.5rem;
      line-height: 1.8;
      font-size: 1.05rem;
    }
    .article-content h2 {
      color: #f1f5f9;
      font-size: 1.8rem;
      font-weight: 800;
      margin-top: 2.5rem;
      margin-bottom: 1.25rem;
      line-height: 1.3;
    }
    .article-content p {
      margin-bottom: 1.5rem;
    }
    .sidebar-toc {
      background: rgba(30, 41, 59, 0.35);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .sidebar-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #f1f5f9;
      margin-top: 0;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(148, 163, 184, 0.08);
      padding-bottom: 0.75rem;
    }
    .template-banner {
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px dashed rgba(34, 211, 238, 0.3);
      background: rgba(34, 211, 238, 0.05);
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; padding:0.75rem 1rem; border-radius:8px; margin-bottom:1.5rem; font-weight:700; font-size:0.875rem; text-align:center;">
      📢 正在预览模板效果（正文区域使用示例占位内容展示）
    </div>

    ${headerContent ? `<div class="template-banner"><b>[页头模板内容]</b><br/>${headerContent}</div>` : ''}

    <div class="detail-grid">
      <div class="article-container">
        <div class="article-header">
          <span class="badge-category">guias</span>
          <h1 class="article-title">示例文章标题：如何配置您的 IPTV 播放列表</h1>
        </div>
        <div class="article-content">
          <h2>1. 准备配置信息</h2>
          <p>这是一段占位示例正文。在真实页面中，这里将渲染您文章的具体段落内容。模板的页头 HTML 和页尾 HTML 会分别包裹在正文的上下两侧。</p>
          <h2>2. 开始导入并播放</h2>
          <p>测试链接是否有效，通常在第一次加载时可能会有一些网络缓冲，建议使用高速稳定的网络环境。</p>
        </div>
      </div>

      <div class="sidebar-toc">
        <h3 class="sidebar-title">Índice del artículo</h3>
        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
          <li><a href="#" style="color:#22d3ee; text-decoration:none;">1. 准备配置信息</a></li>
          <li><a href="#" style="color:#94a3b8; text-decoration:none;">2. 开始导入并播放</a></li>
        </ul>
      </div>
    </div>

    ${footerContent ? `<div class="template-banner" style="margin-top: 2rem;"><b>[页尾模板内容]</b><br/>${footerContent}</div>` : ''}
  </div>
</body>
</html>
  `
}
