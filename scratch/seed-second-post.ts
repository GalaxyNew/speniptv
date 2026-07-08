import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const url = 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const db = new PrismaClient({ adapter } as any)

async function main() {
  // Find the first post
  const firstPost = await db.blogPost.findFirst({
    where: { locale: 'es' }
  })
  
  if (!firstPost) {
    console.error('No first post found!')
    return
  }

  console.log(`First post templateId: ${firstPost.templateId}`)

  // Create a second post in 'es'
  const secondPost = await db.blogPost.upsert({
    where: { locale_slug: { locale: 'es', slug: 'como-configurar-iptv-smart-tv-2026' } },
    update: {},
    create: {
      slug: 'como-configurar-iptv-smart-tv-2026',
      locale: 'es',
      title: 'Cómo Configurar IPTV en Smart TV en 2026',
      excerpt: 'Guía paso a paso para configurar tu lista IPTV en televisores inteligentes en 2026.',
      content: '<h2>Paso 1: Descargar App</h2><p>Descarga la aplicación Smart IPTV o IPTV Smarters en tu televisor.</p><h2>Paso 2: Subir Lista M3U</h2><p>Accede a la web de la app e introduce tu dirección MAC y la URL M3U provista por tu proveedor de IPTV.</p><h2>Conclusión</h2><p>Ya puedes disfrutar de la mejor televisión digital.</p>',
      category: 'guias',
      status: 'published',
      publishAt: new Date(new Date(firstPost.publishAt).getTime() - 24 * 3600 * 1000), // published 1 day earlier
      templateId: firstPost.templateId,
      metaTitle: 'Cómo Configurar IPTV en Smart TV en 2026',
      metaDescription: 'Guía definitiva para instalar y configurar listas IPTV en tu Smart TV en 2026.'
    }
  })

  console.log(`Created/Updated second post: ${secondPost.slug}`)
  
  // Create a third post so both prev and next can show for the middle one
  const thirdPost = await db.blogPost.upsert({
    where: { locale_slug: { locale: 'es', slug: 'mejor-iptv-espana-canales-deportivos' } },
    update: {},
    create: {
      slug: 'mejor-iptv-espana-canales-deportivos',
      locale: 'es',
      title: 'Mejor IPTV España para Canales Deportivos',
      excerpt: 'Comparativa de las mejores opciones de IPTV para ver fútbol, baloncesto y Fórmula 1 en directo.',
      content: '<h2>Los mejores canales deportivos</h2><p>Fútbol, tenis, motor y mucho más con calidad ultra HD 4K sin cortes.</p>',
      category: 'contenido',
      status: 'published',
      publishAt: new Date(new Date(firstPost.publishAt).getTime() + 24 * 3600 * 1000), // published 1 day later
      templateId: firstPost.templateId,
      metaTitle: 'Mejor IPTV España Canales Deportivos',
      metaDescription: 'Descubre los mejores servidores IPTV para ver deportes en España sin cortes.'
    }
  })
  
  console.log(`Created/Updated third post: ${thirdPost.slug}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
