'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { usePermission } from '@/components/admin/AdminShell'

const LOCALES = ['es']
const CATEGORIES = [
  { id: 'guias', label: { es: 'Guías', fr: 'Guides', en: 'Guides', zh: '指南' } },
  { id: 'dispositivos', label: { es: 'Dispositivos', fr: 'Appareils', en: 'Devices', zh: '设备' } },
  { id: 'contenido', label: { es: 'Contenido', fr: 'Contenu', en: 'Content', zh: '内容' } },
  { id: 'comparativas', label: { es: 'Comparativas', fr: 'Comparatifs', en: 'Comparisons', zh: '对比' } },
]

interface BlogTemplate {
  id: string
  name: string
  headerContent?: string
  footerContent?: string
  anchorNavEnabled?: boolean
  keywordLinks?: string
  isDefault?: boolean
}

interface BlogPost {
  id: string
  title: string
  slug: string
  locale: string
  excerpt: string
  content: string
  category: string
  status: string
  publishAt: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  robots: string
  keywords: string
  templateId: string | null
  template?: { name: string } | null
  anchorNavEnabled: boolean
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  title: '',
  slug: '',
  locale: 'es',
  excerpt: '',
  content: '',
  category: 'guias',
  status: 'published',
  publishAt: '', // Date string
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index, follow',
  keywords: '',
  templateId: '',
}

export default function BlogPostsPage() {
  const { canEdit } = usePermission()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [templates, setTemplates] = useState<BlogTemplate[]>([])
  const [filterLocale, setFilterLocale] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSeoModal, setShowSeoModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedDownloadTemplateId, setSelectedDownloadTemplateId] = useState<string>('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Download a styled article HTML template matching the importer format and chosen template design
  function executeDownloadTemplate(templateId: string) {
    const selectedTemplate = templates.find(t => t.id === templateId)
    const templateName = selectedTemplate?.name || 'Standard SEO T'
    const headerContent = selectedTemplate?.headerContent || ''
    const footerContent = selectedTemplate?.footerContent || ''
    const enableToc = selectedTemplate?.anchorNavEnabled ?? false

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- ✅ 文章标题：导入后自动填入「文章标题」与「SEO 标题」字段 -->
  <title>在此填写文章标题</title>

  <!-- ✅ SEO 描述：导入后自动填入「SEO 描述」字段 -->
  <meta name="description" content="在此填写页面 SEO 描述，建议 120-160 个字符" />

  <!-- ✅ SEO 关键词：导入后自动填入「SEO 关键词」字段，多个关键词用英文逗号分隔 -->
  <meta name="keywords" content="关键词1, 关键词2, 关键词3" />

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
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 2rem;
    }
    .breadcrumbs a {
      color: #22d3ee;
      text-decoration: none;
      font-weight: 600;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: ${enableToc ? '1fr 280px' : '1fr'};
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
    .article-content h3 {
      color: #f1f5f9;
      font-size: 1.4rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.3;
    }
    .article-content p {
      margin-bottom: 1.5rem;
    }
    .article-content a {
      color: #22d3ee;
      text-decoration: underline;
    }
    .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.75rem;
      margin: 1.5rem 0;
      border: 1px solid rgba(148, 163, 184, 0.15);
    }
    .article-content blockquote {
      border-left: 4px solid #22d3ee;
      background: rgba(34, 211, 238, 0.05);
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
      font-style: italic;
    }
    .article-content ul, .article-content ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }
    .article-content li {
      margin-bottom: 0.5rem;
    }
    .sidebar-toc {
      position: sticky;
      top: 40px;
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
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .toc-item {
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .toc-link {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.15s;
    }
    .toc-link:hover {
      color: #22d3ee;
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
      📢 这是一个文章书写模板。请在下方的 &lt;article&gt; 标签内编辑您的文章内容，并在后台导入此 HTML 文件。
    </div>

    ${headerContent ? `<div class="template-banner"><b>[页头模板内容]</b><br/>${headerContent}</div>` : ''}

    <div class="detail-grid">
      <div class="article-container">
        <div class="article-header">
          <span class="badge-category">guias</span>
          <h1 class="article-title">在此填写文章主标题</h1>
        </div>
        <div class="article-content">
          <!-- ✅ 文章正文区域：导入后自动提取 <article> 标签内的全部 HTML 内容 -->
          <!-- 💡 支持完整的 HTML 标签排版，如 h1~h6、p、ul、ol、table、img、a 等 -->
          <article>
            <h2 id="heading-1">1. 准备配置信息</h2>
            <p>在此填写章节正文内容。可以包含多个段落、列表、图片等。</p>
            <ul>
              <li>要点一：在此描述</li>
              <li>要点二：在此描述</li>
              <li>要点三：在此描述</li>
            </ul>

            <h2 id="heading-2">2. 开始导入并播放</h2>
            <p>在此填写第二章节的正文内容。</p>

            <h3 id="heading-3">子章节标题</h3>
            <p>在此填写子章节正文内容。</p>

            <h2 id="heading-4">总结</h2>
            <p>在此填写文章的总结内容，回顾要点，并可加入行动号召（CTA）语句。</p>
          </article>
        </div>
      </div>

      ${enableToc ? `
      <div class="sidebar-toc">
        <h3 class="sidebar-title">Índice del artículo</h3>
        <ul class="toc-list">
          <li class="toc-item">
            <a href="#heading-1" class="toc-link">1. 准备配置信息</a>
          </li>
          <li class="toc-item">
            <a href="#heading-2" class="toc-link">2. 开始导入并播放</a>
          </li>
          <li class="toc-item" style="padding-left: 1rem;">
            <a href="#heading-3" class="toc-link">子章节标题</a>
          </li>
          <li class="toc-item">
            <a href="#heading-4" class="toc-link">总结</a>
          </li>
        </ul>
      </div>
      ` : ''}
    </div>

    ${footerContent ? `<div class="template-banner" style="margin-top: 2rem;"><b>[页尾模板内容]</b><br/>${footerContent}</div>` : ''}
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-template-${templateName.replace(/\s+/g, '-').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const q = filterLocale !== 'all' ? `?locale=${filterLocale}` : ''
    const res = await fetch(`/api/admin/blog-posts${q}`)
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterLocale])

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/blog-templates')
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetchPosts()
    fetchTemplates()
  }, [fetchPosts])

  // Get current datetime string in local format YYYY-MM-DDTHH:MM
  function getLocalDateTimeString() {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  function openAdd() {
    setEditingId(null)
    const defaultTemplate = templates.find(t => t.isDefault) || templates.find(t => t.name === 'Standard SEO T') || templates[0]
    setForm({
      ...emptyForm,
      publishAt: getLocalDateTimeString(),
      templateId: defaultTemplate ? defaultTemplate.id : '',
    })
    setError('')
    setShowForm(true)
  }

  function openEdit(post: BlogPost) {
    setEditingId(post.id)
    
    // Format publishAt date to local datetime string for input type="datetime-local"
    let localPublishAt = ''
    if (post.publishAt) {
      const d = new Date(post.publishAt)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      localPublishAt = d.toISOString().slice(0, 16)
    }

    setForm({
      title: post.title,
      slug: post.slug,
      locale: post.locale,
      excerpt: post.excerpt || '',
      content: post.content,
      category: post.category,
      status: post.status,
      publishAt: localPublishAt,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      canonicalUrl: post.canonicalUrl || '',
      robots: post.robots || 'index, follow',
      keywords: post.keywords || '',
      templateId: post.templateId || '',
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      setError('文章标题和链接别名 (Slug) 不能为空')
      return
    }
    if (!form.metaTitle.trim() || !form.metaDescription.trim() || !form.keywords.trim()) {
      setError('请配置SEO信息')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/blog-posts/${editingId}` : '/api/admin/blog-posts'
      const method = editingId ? 'PATCH' : 'POST'
      
      const payload = {
        ...form,
        templateId: form.templateId === '' ? null : form.templateId,
        publishAt: form.status === 'scheduled' ? new Date(form.publishAt).toISOString() : new Date().toISOString(),
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
      fetchPosts()
    } catch (err: any) {
      setError(err.message || '保存失败，请检查数据重试')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string, title: string) {
    setDeleteConfirm({ id, title })
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/blog-posts/${deleteConfirm.id}`, { method: 'DELETE' })
      const resData = await res.json()
      if (res.status === 403) {
        throw new Error('当前无权限修改，请联系管理员！')
      }
      if (!res.ok) {
        throw new Error(resData.error || '删除失败')
      }
      setDeleteConfirm(null)
      fetchPosts()
    } catch (err: any) {
      setError(err.message || '删除发生错误，请重试')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  // Handle HTML import
  function handleImportHtmlClick() {
    fileInputRef.current?.click()
  }

  function handleHtmlFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')

        // 1. Title
        const titleVal = doc.querySelector('title')?.innerText || doc.querySelector('h1')?.innerText || ''
        
        // 2. Meta Description
        const descVal = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        
        // 3. SEO Keywords
        const kwVal = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
        
        // 4. Body Content
        // Try to get primary article elements, otherwise fallback to entire body content
        const articleElement = doc.querySelector('article') || doc.querySelector('#content') || doc.body
        const contentVal = articleElement.innerHTML || ''

        // Generate a guess for the slug if empty
        const slugGuess = titleVal
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 50)

        setForm(f => ({
          ...f,
          title: titleVal || f.title,
          slug: slugGuess || f.slug,
          content: contentVal || f.content,
          metaDescription: descVal || f.metaDescription,
          keywords: kwVal || f.keywords,
          metaTitle: titleVal || f.metaTitle,
        }))

        alert('HTML 文件解析成功！已自动提取并填入相关表单项。')
      } catch (err) {
        console.error(err)
        alert('解析 HTML 文件出错，请手动录入')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Clear input
  }

  const localeBadgeColor: Record<string, string> = {
    fr: '#3B82F6', es: '#10B981', en: '#F59E0B', zh: '#EC38BC',
  }

  // Map category key to display label based on a fallback locale
  function getCategoryLabel(catId: string) {
    const matched = CATEGORIES.find(c => c.id === catId)
    if (!matched) return catId
    return matched.label.zh || matched.label.es
  }

  // Format Status Badge
  function renderStatusBadge(post: BlogPost) {
    const now = new Date()
    const pubDate = new Date(post.publishAt)

    if (post.status === 'draft') {
      return (
        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>
          ○ 草稿
        </span>
      )
    } else if (post.status === 'scheduled' && pubDate > now) {
      return (
        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }} title={`计划发布时间: ${pubDate.toLocaleString()}`}>
          🕒 定时发布
        </span>
      )
    } else {
      return (
        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
          ● 已发布
        </span>
      )
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      {/* Invisible file input */}
      <input type="file" ref={fileInputRef} onChange={handleHtmlFileChange} accept=".html,.htm" style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>📰 文章管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>撰写、导入及调度你的多语言 Blog 博客文章，支持定时发布与自定义模版套用</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <button onClick={() => {
            const defaultTemplate = templates.find(t => t.isDefault) || templates.find(t => t.name === 'Standard SEO T') || templates[0]
            setSelectedDownloadTemplateId(defaultTemplate ? defaultTemplate.id : '')
            setShowDownloadModal(true)
          }} style={{
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.5)',
            color: '#a855f7', borderRadius: 10, padding: '0.625rem 1.1rem',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.2s',
          }}>
            📄 下载文章模板
          </button>
          {canEdit && (
            <button onClick={openAdd} style={{
              background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
              color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              ＋ 新建文章
            </button>
          )}
        </div>
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
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', borderRadius: 12, border: '2px dashed rgba(148,163,184,0.2)' }}>
          暂无博客文章，点击右上角「新建文章」或导入 HTML 文件开始
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.15)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(34,211,238,0.08)' }}>
                {['文章标题', 'URL 路径', '分类', '模板', '状态', '发布日期', '操作'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr key={post.id} style={{ borderTop: '1px solid rgba(148,163,184,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
                    {post.title}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <a href={`/${post.locale}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '0.85rem' }}>
                      /{post.locale}/blog/{post.slug}
                    </a>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {getCategoryLabel(post.category)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#a855f7', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {post.template?.name || '无'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                    {renderStatusBadge(post)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(post.publishAt).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap' }}>
                      <button onClick={() => openEdit(post)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(34,211,238,0.4)',
                        background: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                      }}>{canEdit ? '编辑' : '查看'}</button>
                      {canEdit && (
                        <button onClick={() => handleDelete(post.id, post.title)} style={{
                          padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                        }}>删除</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setDeleteConfirm(null)}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480,
            border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>🗑️</div>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem', textAlign: 'center' }}>确认删除文章</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', textAlign: 'center' }}>即将永久删除：</p>
            <p style={{ color: '#f87171', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.5rem', textAlign: 'center', wordBreak: 'break-all' }}>「{deleteConfirm.title}」</p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>此操作不可撤销，请谨慎操作。</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(148,163,184,0.1)', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
              >取消</button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
              >{deleting ? '删除中...' : '确认删除'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 1200,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', position: 'relative'
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

            {/* Form Title & HTML Importer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 1.5rem', flexWrap: 'wrap', gap: '0.5rem', paddingRight: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-1, #22d3ee)' }}>
                {editingId ? (canEdit ? '✏️ 编辑文章' : '👁️ 查看文章') : '＋ 新建文章'}
              </h2>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {canEdit && (
                  <button onClick={handleImportHtmlClick} style={{
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    color: '#10B981', borderRadius: 8, padding: '0.4rem 0.875rem',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                  }}>
                    📥 导入 HTML
                  </button>
                )}
                <button onClick={() => setShowSeoModal(true)} style={{
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                  color: '#F59E0B', borderRadius: 8, padding: '0.4rem 0.875rem',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}>
                  {canEdit ? '🔍 配置 SEO' : '🔍 查看 SEO'}
                  {(form.metaTitle || form.metaDescription || form.keywords) ? (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginLeft: 4 }} />
                  ) : null}
                </button>
                <button onClick={() => setShowPreviewModal(true)} style={{
                  background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)',
                  color: '#22d3ee', borderRadius: 8, padding: '0.4rem 0.875rem',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}>
                  👁️ 预览效果
                </button>
              </div>
            </div>

            {/* Metadata Fields Row Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', background: 'rgba(15,23,42,0.2)', padding: '1.25rem', borderRadius: 10, border: '1px solid rgba(148,163,184,0.05)' }}>
              
              {/* Col 1: Title & Slug */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>文章标题</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    disabled={!canEdit}
                    placeholder="例：2025年最佳智能电视IPTV配置" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>链接别名 (Slug)</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    disabled={!canEdit}
                    placeholder="例：mejor-iptv-smart-tv" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    预览链接: /{form.locale}/blog/{form.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')}
                  </span>
                </div>
              </div>

              {/* Col 2: Locale, Category, Template */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>所属语言</label>
                    <select value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))}
                      disabled={!canEdit}
                      style={{
                        width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                        outline: 'none', cursor: 'pointer',
                      }}>
                      {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()} – {l === 'fr' ? '法语' : l === 'es' ? '西班牙语' : l === 'en' ? '英语' : '中文'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>分类类别</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      disabled={!canEdit}
                      style={{
                        width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                        outline: 'none', cursor: 'pointer',
                      }}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label.zh || c.label.es} ({c.id})</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>套用模板</label>
                  <select value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                    disabled={!canEdit}
                    style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', cursor: 'pointer',
                    }}>
                    <option value="">-- 不使用模板 (纯正文展示) --</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Col 3: Excerpt, Status & Scheduling */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: form.status === 'scheduled' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>发布状态</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      disabled={!canEdit}
                      style={{
                        width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                        outline: 'none', cursor: 'pointer',
                      }}>
                      <option value="published">立即发布</option>
                      <option value="scheduled">定时发布</option>
                      <option value="draft">暂存草稿</option>
                    </select>
                  </div>
                  {form.status === 'scheduled' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>计划发布时间</label>
                      <input type="datetime-local" value={form.publishAt} onChange={e => setForm(f => ({ ...f, publishAt: e.target.value }))}
                        disabled={!canEdit}
                        style={{
                          width: '100%', padding: '0.575rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                          outline: 'none', boxSizing: 'border-box',
                        }} />
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>文章摘要 (Excerpt - 用于列表页)</label>
                  <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                    disabled={!canEdit}
                    placeholder="输入该文章的摘要，用于博客列表的简短呈现（留空则不显示）" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
              </div>

            </div>

            {/* Bottom Section: Full Width Rich Text Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>文章正文内容</label>
              <RichTextEditor
                value={form.content}
                onChange={val => setForm(f => ({ ...f, content: val }))}
                readOnly={!canEdit}
                placeholder="请输入文章正文，支持可视化排版或直接编辑 HTML 源码..."
              />
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '1rem' }}>⚠️ {error}</p>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: '0.625rem 1.25rem', borderRadius: 9, border: '1px solid rgba(148,163,184,0.25)',
                background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}>{canEdit ? '取消' : '关闭'}</button>
              {canEdit && (
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '0.625rem 1.5rem', borderRadius: 9, border: 'none',
                  background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
                  color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                  opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
                }}>
                  {saving ? '保存中…' : '保存'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEO Modal Popup */}
      {showSeoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            <button type="button" onClick={() => setShowSeoModal(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: '1.5rem', cursor: 'pointer', outline: 'none',
              transition: 'color 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
               onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              &times;
            </button>

            <h3 style={{ margin: '0 0 1.25rem', color: '#22d3ee', fontSize: '1.1rem', fontWeight: 800 }}>🔍 配置 SEO 属性</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO 标题 (Meta Title)</label>
                <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                  disabled={!canEdit}
                  placeholder="留空则默认使用文章标题" style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO 描述 (Meta Description)</label>
                <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                  disabled={!canEdit}
                  placeholder="请输入 SEO 页面摘要描述，建议 120-160 字符" rows={3} style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box', resize: 'none'
                  }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO 关键词 (多个英文逗号分隔)</label>
                <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                  disabled={!canEdit}
                  placeholder="例如：IPTV España, buy IPTV, lists" style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>规范链接 (Canonical URL)</label>
                  <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                    disabled={!canEdit}
                    placeholder="留空则自动生成当前链接" style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>爬虫指令 (Robots)</label>
                  <select value={form.robots} onChange={e => setForm(f => ({ ...f, robots: e.target.value }))}
                    disabled={!canEdit}
                    style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                      outline: 'none', cursor: 'pointer',
                    }}>
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                    <option value="noindex, follow">noindex, follow</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <button onClick={() => setShowSeoModal(false)} style={{
                padding: '0.625rem 1.5rem', borderRadius: 9, border: 'none',
                background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Template Modal Popup */}
      {showDownloadModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            position: 'relative', fontFamily: 'Outfit, Inter, sans-serif'
          }}>
            <button type="button" onClick={() => setShowDownloadModal(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: '1.5rem', cursor: 'pointer', outline: 'none',
              transition: 'color 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
               onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              &times;
            </button>

            <h3 style={{ margin: '0 0 1.25rem', color: '#22d3ee', fontSize: '1.1rem', fontWeight: 800 }}>📄 选择下载模板</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>选择模板样式</label>
                <select value={selectedDownloadTemplateId} onChange={e => setSelectedDownloadTemplateId(e.target.value)}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', cursor: 'pointer',
                  }}>
                  <option value="">-- 选择模板 --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? ' (默认)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDownloadTemplateId && (
                <>
                  <div style={{
                    background: 'rgba(15,23,42,0.4)', borderRadius: 8, padding: '1rem',
                    border: '1px solid rgba(148,163,184,0.1)', fontSize: '0.85rem', color: '#cbd5e1'
                  }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>目录导航 (ToC):</span>
                      <span style={{ fontWeight: 600, color: templates.find(t => t.id === selectedDownloadTemplateId)?.anchorNavEnabled ? '#10B981' : '#f87171' }}>
                        {templates.find(t => t.id === selectedDownloadTemplateId)?.anchorNavEnabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>页头内容:</span>
                      <span>
                        {templates.find(t => t.id === selectedDownloadTemplateId)?.headerContent ? `${templates.find(t => t.id === selectedDownloadTemplateId)?.headerContent?.length || 0} 字符` : '无'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>页尾内容:</span>
                      <span>
                        {templates.find(t => t.id === selectedDownloadTemplateId)?.footerContent ? `${templates.find(t => t.id === selectedDownloadTemplateId)?.footerContent?.length || 0} 字符` : '无'}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>模板下载链接 (供获取/分享)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/api/admin/blog-templates/${selectedDownloadTemplateId}/download` : ''}
                        style={{
                          flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.8rem',
                          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#22d3ee',
                          outline: 'none', textOverflow: 'ellipsis'
                        }} onClick={e => e.currentTarget.select()} />
                      <button onClick={() => {
                        const url = `${window.location.origin}/api/admin/blog-templates/${selectedDownloadTemplateId}/download`
                        navigator.clipboard.writeText(url)
                        alert('下载链接已复制到剪贴板！')
                      }} style={{
                        padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
                        background: 'rgba(34,211,238,0.15)', color: '#22d3ee', fontWeight: 700,
                        cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s',
                      }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.25)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.15)'}>
                        复制链接
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button onClick={() => setShowDownloadModal(false)} style={{
                padding: '0.625rem 1.25rem', borderRadius: 9, border: '1px solid rgba(148,163,184,0.2)',
                background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                transition: 'all 0.2s',
              }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                 onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                取消
              </button>
              <button onClick={() => {
                if (selectedDownloadTemplateId) {
                  executeDownloadTemplate(selectedDownloadTemplateId)
                  setShowDownloadModal(false)
                } else {
                  alert('请先选择一个模板')
                }
              }} style={{
                padding: '0.625rem 1.5rem', borderRadius: 9, border: 'none',
                background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              }}>
                直接下载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
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
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1.1rem', fontWeight: 800 }}>👁️ 文章实时效果预览</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>预览页面包含当前套用模板的页头/页尾，自动生成的侧边栏锚点及关键词内链</p>
            </div>
            <button onClick={() => setShowPreviewModal(false)} style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
            }}>
              关闭预览
            </button>
          </div>

          <div style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
            <iframe
              srcDoc={generatePreviewHtml(form, templates)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Article Live Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Client-side HTML Live Preview Compiler
function generatePreviewHtml(form: typeof emptyForm, templates: BlogTemplate[]) {
  const selectedTemplate = templates.find(t => t.id === form.templateId)
  const headerContent = selectedTemplate?.headerContent || ''
  const footerContent = selectedTemplate?.footerContent || ''
  const enableToc = selectedTemplate?.anchorNavEnabled ?? false
  
  // Keyword links injection helper (simplified for browser preview)
  let renderedContent = form.content
  let keywordLinksMap: Record<string, string> = {}
  if (selectedTemplate?.keywordLinks) {
    try {
      keywordLinksMap = JSON.parse(selectedTemplate.keywordLinks)
    } catch (e) {}
  }
  
  if (Object.keys(keywordLinksMap).length > 0) {
    const keywords = Object.keys(keywordLinksMap).sort((a, b) => b.length - a.length)
    const tokens = renderedContent.split(/(<[^>]+>)/g)
    let insideAnchor = 0
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.startsWith('<')) {
        const lowerTag = token.toLowerCase()
        if (lowerTag.startsWith('<a ') || lowerTag === '<a>') {
          insideAnchor++
        } else if (lowerTag === '</a>') {
          insideAnchor = Math.max(0, insideAnchor - 1)
        }
      } else {
        if (insideAnchor === 0 && token.trim().length > 0) {
          let processedText = token
          for (const kw of keywords) {
            const url = keywordLinksMap[kw]
            const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            const regex = new RegExp(`(${escapedKw})`, 'gi')
            processedText = processedText.replace(regex, (match) => {
              return `<a href="${url}" class="keyword-link" style="color:#22d3ee;text-decoration:underline;font-weight:600;">${match}</a>`
            })
          }
          tokens[i] = processedText
        }
      }
    }
    renderedContent = tokens.join('')
  }

  // Extract headings for Table of Contents sidebar
  const toc: { id: string; text: string; level: number }[] = []
  let headingIndex = 0
  const tokens = renderedContent.split(/(<[^>]+>)/g)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.startsWith('<')) {
      const match = token.match(/^<(h2|h3)([^>]*)>$/i)
      if (match) {
        const level = parseInt(match[1])
        const originalAttrs = match[2]
        let headingText = ''
        let lookahead = i + 1
        const closingTag = `</${match[1]}>`.toLowerCase()
        while (lookahead < tokens.length && tokens[lookahead].toLowerCase() !== closingTag) {
          headingText += tokens[lookahead]
          lookahead++
        }
        const cleanText = headingText.replace(/<[^>]*>/g, '').trim()
        if (cleanText) {
          headingIndex++
          const id = `heading-${headingIndex}`
          tokens[i] = `<${match[1]} id="${id}"${originalAttrs}>`
          toc.push({ id, text: cleanText, level })
        }
      }
    }
  }
  renderedContent = tokens.join('')
  console.log('Preview ToC:', enableToc, toc.length, JSON.stringify(toc))

  // Standalone HTML template for iframe
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Preview: ${form.title}</title>
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
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 2rem;
    }
    .breadcrumbs a {
      color: #22d3ee;
      text-decoration: none;
      font-weight: 600;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: ${enableToc ? '1fr 280px' : '1fr'};
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
    .article-content h3 {
      color: #f1f5f9;
      font-size: 1.4rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
      line-height: 1.3;
    }
    .article-content p {
      margin-bottom: 1.5rem;
    }
    .article-content a {
      color: #22d3ee;
      text-decoration: underline;
    }
    .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.75rem;
      margin: 1.5rem 0;
      border: 1px solid rgba(148, 163, 184, 0.15);
    }
    .article-content blockquote {
      border-left: 4px solid #22d3ee;
      background: rgba(34, 211, 238, 0.05);
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
      font-style: italic;
    }
    .article-content ul, .article-content ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }
    .article-content li {
      margin-bottom: 0.5rem;
    }
    .sidebar-toc {
      position: sticky;
      top: 40px;
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
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .toc-item {
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .toc-link {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.15s;
    }
    .toc-link:hover {
      color: #22d3ee;
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
    <div class="breadcrumbs">
      <a href="#">Inicio</a>
      <span>/</span>
      <a href="#">Blog</a>
      <span>/</span>
      <span>${form.title || '无标题文章'}</span>
    </div>

    ${headerContent ? `<div class="template-banner"><b>[页头模板内容]</b><br/>${headerContent}</div>` : ''}

    <div class="detail-grid">
      <div class="article-container">
        <div class="article-header">
          <span class="badge-category">${form.category}</span>
          <h1 class="article-title">${form.title || '无标题文章'}</h1>
        </div>
        <div class="article-content">
          ${renderedContent || '<p style="color:#64748b; font-style:italic;">文章正文为空</p>'}
        </div>
      </div>

      ${enableToc ? `
        <div class="sidebar-toc">
          <h3 class="sidebar-title">Índice del artículo</h3>
          ${toc.length > 0 ? `
            <ul class="toc-list">
              ${toc.map(item => `
                <li class="toc-item" style="padding-left: ${item.level === 3 ? '1rem' : '0'};">
                  <a href="#${item.id}" class="toc-link">${item.text}</a>
                </li>
              `).join('')}
            </ul>
          ` : `
            <div style="font-size:0.75rem; color:#64748b; font-style:italic; line-height:1.4;">
              [ToC 导航已启用]<br/>在文章正文内添加 H2 或 H3 标题后将在此处自动生成目录。
            </div>
          `}
        </div>
      ` : ''}
    </div>

    ${footerContent ? `<div class="template-banner" style="margin-top: 2rem;"><b>[页尾模板内容]</b><br/>${footerContent}</div>` : ''}
  </div>
</body>
</html>
  `
}
