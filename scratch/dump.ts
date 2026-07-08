import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const url = 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const db = new PrismaClient({ adapter } as any)

async function main() {
  const templates = await db.blogTemplate.findMany()
  console.log('--- TEMPLATES ---')
  for (const t of templates) {
    console.log(`ID: ${t.id}`)
    console.log(`Name: ${t.name}`)
    console.log(`Header Content:\n${t.headerContent}`)
    console.log(`Footer Content:\n${t.footerContent}`)
    console.log('-----------------')
  }

  const posts = await db.blogPost.findMany({
    take: 3
  })
  console.log('--- POSTS ---')
  for (const p of posts) {
    console.log(`Slug: ${p.slug}, Title: ${p.title}, Category: ${p.category}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
