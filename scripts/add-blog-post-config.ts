import { db } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function main() {
  const jsonPath = path.resolve(__dirname, 'config-post.json')
  if (!fs.existsSync(jsonPath)) {
    console.error(`Missing blog JSON payload: ${jsonPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(jsonPath, 'utf8')
  const postData = JSON.parse(raw)
  const slug = 'iptv-smarters-pro-configuration-code'
  const locale = 'es'

  // Dynamically resolve template ID
  const firstTemplate = await db.blogTemplate.findFirst()
  const templateId = firstTemplate ? firstTemplate.id : null

  const post = await db.blogPost.upsert({
    where: {
      locale_slug: { locale, slug }
    },
    update: {
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category,
      metaTitle: postData.metaTitle,
      metaDescription: postData.metaDescription,
      keywords: postData.keywords,
      status: 'published',
      publishAt: new Date(),
      templateId: templateId,
    },
    create: {
      locale,
      slug,
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category,
      metaTitle: postData.metaTitle,
      metaDescription: postData.metaDescription,
      keywords: postData.keywords,
      status: 'published',
      publishAt: new Date(),
      templateId: templateId,
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
