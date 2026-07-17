import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

interface Params { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  // Verify permission
  const permission = await verifyPermission('blog-templates', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { id } = await params
  const template = await db.blogTemplate.findUnique({
    where: { id }
  })

  if (!template) {
    return new Response('Template not found', { status: 404 })
  }

  const templateName = template.name || 'Standard SEO T'
  const headerContent = template.headerContent || ''
  const footerContent = template.footerContent || ''
  const enableToc = template.anchorNavEnabled ?? false

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

  const safeFilename = encodeURIComponent(`blog-template-${templateName.replace(/\s+/g, '-').toLowerCase()}.html`)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`
    }
  })
}
