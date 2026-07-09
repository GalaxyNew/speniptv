import { db } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  const htmlPath = 'E:\\数据\\IPTV-西班牙\\IPTV_Basemg_sp\\guides\\IPTV-Smarters-Pro-configuration-code.html'
  if (!fs.existsSync(htmlPath)) {
    console.error(`Source HTML file not found: ${htmlPath}`)
    process.exit(1)
  }

  const html = fs.readFileSync(htmlPath, 'utf8')

  // Extract content
  const startIndex = html.indexOf('<div class="highlight-card mb-8">')
  const endIndex = html.indexOf('</article>')

  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not locate article bounds in HTML file.')
    process.exit(1)
  }

  let articleHtml = html.substring(startIndex, endIndex).trim()

  // Clean trailing closing divs from the article card if any
  if (articleHtml.endsWith('</div>\n                </div>')) {
    articleHtml = articleHtml.substring(0, articleHtml.length - 28)
  } else if (articleHtml.endsWith('</div>\n            </div>')) {
    articleHtml = articleHtml.substring(0, articleHtml.length - 27)
  } else if (articleHtml.endsWith('</div>\n        </div>')) {
    articleHtml = articleHtml.substring(0, articleHtml.length - 25)
  } else if (articleHtml.endsWith('</div>\n                     </div>\n                 </div>')) {
    articleHtml = articleHtml.substring(0, articleHtml.length - 62)
  } else if (articleHtml.endsWith('</div>\n                     </div>')) {
    articleHtml = articleHtml.substring(0, articleHtml.length - 35)
  }

  // Prepend stylesheet block
  const customStyle = `<style>
.step-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin: 1.5rem 0 2rem;
}
@media (min-width: 768px) {
  .step-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.step-card {
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(30, 41, 59, 0.3);
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(34, 211, 238, 0.3);
}
.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%);
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.step-note {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: rgba(34, 211, 238, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.2);
  color: #c1e8ff;
  font-size: 0.9rem;
}
.callout {
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.85);
  box-shadow: 0 35px 90px -60px rgba(56, 189, 248, 0.4);
}
.callout-note {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.12);
}
.callout h4 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #22d3ee;
}
.highlight-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.highlight-card h3 {
  margin-top: 0 !important;
  color: #f1f5f9;
}
.content-section {
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.82);
  padding: clamp(1.75rem, 1.25rem + 1.2vw, 2.75rem);
  margin: 2.5rem 0;
  box-shadow: 0 45px 120px -70px rgba(59, 130, 246, 0.55);
}
.section-heading {
  font-size: 1.65rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #60a5fa;
}
.section-heading span {
  display: inline-block;
}
.section-subheading {
  font-size: 1.35rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: #a855f7;
}
.section-subheading span {
  display: inline-block;
}
.section-body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.usage-layout {
  display: grid;
  gap: 1.75rem;
}
.usage-copy p {
  margin-bottom: 1rem;
}
.media-frame {
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(2, 6, 23, 0.55);
  padding: 0.85rem;
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
}
.media-frame img {
  margin: 0 !important;
  width: 100%;
  border-radius: 0.75rem;
  box-shadow: 0 30px 80px -50px rgba(15, 23, 42, 0.85);
}
.info-panel {
  border-radius: 1rem;
  border: 1px solid rgba(129, 140, 248, 0.35);
  background: rgba(30, 41, 59, 0.7);
  padding: 1.5rem;
  box-shadow: 0 32px 90px -60px rgba(129, 140, 248, 0.45);
}
.info-panel p {
  margin-bottom: 1rem;
  color: #cbd5f5;
}
.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}
.info-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #e2e8f0;
  font-weight: 500;
}
.info-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
}
.instruction-flow {
  display: grid;
}
.instruction-card {
  border-radius: 1rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(8, 47, 73, 0.45);
  padding: 1.5rem;
  display: grid;
  gap: 1.25rem;
}
.instruction-card p {
  margin-bottom: 0.5rem;
}
.instruction-card strong {
  color: #e0f2fe;
}
</style>
`

  articleHtml = customStyle + articleHtml

  // Replacements
  articleHtml = articleHtml.replace(/src="\.\.\/static\/smart\//g, 'src="/static/smart/')
  articleHtml = articleHtml.replace(/srcset="\.\.\/static\/smart\//g, 'srcset="/static/smart/')
  articleHtml = articleHtml.replace(/href="Install-IPTV-Smarters-Pro-on-FireStick.html"/g, 'href="/es/blog/iptv-smarters-pro-firestick-instalar-usar"')
  articleHtml = articleHtml.replace(/<a[^>]*>([\s\r\n]*Mejor suscripción IPTV España[\s\r\n]*)<\/a>/gi, '<a href="https://igoriptv2.com/" style="color: orange;">$1</a>')
  
  // Clean responsive attrs
  articleHtml = articleHtml.replace(/\s+srcset="[^"]*"/gi, '')
  articleHtml = articleHtml.replace(/\s+sizes="[^"]*"/gi, '')

  // Remove trailing details
  articleHtml = articleHtml.trim()

  const slug = 'iptv-smarters-pro-configuration-code'
  const locale = 'es'

  // Upsert the post
  const post = await db.blogPost.upsert({
    where: {
      locale_slug: { locale, slug }
    },
    update: {
      title: 'Cómo configurar listas de reproducción de IPTV en SMARTER Pro (2026)',
      excerpt: 'Aprenda a configurar IPTV Smarters Pro con listas M3U o la API Xtream Codes. Guía paso a paso para disfrutar de su contenido IPTV favorito.',
      content: articleHtml,
      category: 'guias',
      metaTitle: 'Cómo configurar listas de reproducción de IPTV en SMARTER Pro (2026)',
      metaDescription: 'Aprenda a configurar IPTV Smarters Pro con listas M3U o la API Xtream Codes. Guía paso a paso para disfrutar de su contenido IPTV favorito.',
      keywords: 'Configurar IPTV Smarters, Usar IPTV Smarters, Listas M3U, Xtream Codes, Tutorial IPTV',
      status: 'published',
      publishAt: new Date(),
      templateId: 'test-template-id', // Standard template with discount code banner
    },
    create: {
      locale,
      slug,
      title: 'Cómo configurar listas de reproducción de IPTV en SMARTER Pro (2026)',
      excerpt: 'Aprenda a configurar IPTV Smarters Pro con listas M3U o la API Xtream Codes. Guía paso a paso para disfrutar de su contenido IPTV favorito.',
      content: articleHtml,
      category: 'guias',
      metaTitle: 'Cómo configurar listas de reproducción de IPTV en SMARTER Pro (2026)',
      metaDescription: 'Aprenda a configurar IPTV Smarters Pro con listas M3U o la API Xtream Codes. Guía paso a paso para disfrutar de su contenido IPTV favorito.',
      keywords: 'Configurar IPTV Smarters, Usar IPTV Smarters, Listas M3U, Xtream Codes, Tutorial IPTV',
      status: 'published',
      publishAt: new Date(),
      templateId: 'test-template-id', // Standard template with discount code banner
    }
  })

  console.log(`Blog post successfully added/updated in database. Locale: ${post.locale}, Slug: ${post.slug}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
