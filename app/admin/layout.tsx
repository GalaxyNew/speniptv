import type { Metadata } from 'next'
import NextAuthProvider from '@/components/admin/NextAuthProvider'

import { db } from '@/lib/db'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await db.siteSettings.findUnique({ where: { id: 'main' } })
  let favicon = settings?.faviconUrl
  
  if (!favicon) {
    const defaultLocale = settings?.defaultLocale || 'es'
    const localeSettings = await db.personalizedSettings.findUnique({ where: { locale: defaultLocale } })
    favicon = localeSettings?.faviconUrl
  }
  
  if (!favicon) {
    const anySettings = await db.personalizedSettings.findFirst({
      where: { faviconUrl: { not: '' } }
    })
    favicon = anySettings?.faviconUrl
  }
  
  favicon = favicon || '/favicon.ico'
  return {
    title: { default: '管理后台', template: '%s | Admin' },
    robots: 'noindex, nofollow',
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    }
  }
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Cinzel:wght@400..900&family=Syne:wght@400..800&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body, button, input, select, textarea {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}} />
      </head>
      <body style={{ margin: 0, background: '#0b0f19', color: '#f1f5f9' }}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
