import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['es']
const defaultLocale = 'es'
const adminPrefix = '/admin'

let cachedDefaultLocale = 'es'
let cacheTimestamp = 0

// Get configuration default locale from database with local caching to prevent deadlock and optimize latency
async function getDefaultLocale(origin: string) {
  const now = Date.now()
  if (now - cacheTimestamp < 10000) {
    return cachedDefaultLocale
  }
  
  // Try local address first to bypass Nginx loopback/SSL errors on the server
  const urlsToTry = ['http://127.0.0.1:3000/api/public-settings']
  
  if (origin && !origin.includes('127.0.0.1:3000')) {
    const portMatch = origin.match(/:(\d+)$/)
    if (portMatch) {
      urlsToTry.push(`http://127.0.0.1:${portMatch[1]}/api/public-settings`)
    }
    urlsToTry.push(`${origin}/api/public-settings`)
  }

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1000)
      const res = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 10 }
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data && data.defaultLocale) {
          cachedDefaultLocale = data.defaultLocale
          cacheTimestamp = now
          return cachedDefaultLocale
        }
      }
    } catch (e) {
      // Quiet warning for local fallback failures
      console.warn(`Failed to fetch defaultLocale from ${url}:`, e)
    }
  }
  return cachedDefaultLocale
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // Redirect www to non-www (SEO canonicalization)
  if (host.startsWith('www.')) {
    const nonWwwHost = host.substring(4).split(':')[0]
    return new NextResponse(null, {
      status: 301,
      headers: {
        Location: `https://${nonWwwHost}${pathname}${request.nextUrl.search}`,
      },
    })
  }

  // Skip static assets, api routes, and _next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Admin routes: check for auth cookie (NextAuth session)
  if (pathname.startsWith(adminPrefix)) {
    // Allow login page through
    if (pathname === '/admin/login') return NextResponse.next()
    // For other admin routes, NextAuth will handle auth at the page level
    return NextResponse.next()
  }

  // Fetch the configured defaultLocale setting from DB
  const configLocale = await getDefaultLocale(request.nextUrl.origin)

  let targetLocale = ''

  if (configLocale === 'auto') {
    // Mode: Detect based on country or browser language preference
    let detectedLocale = ''

    // 1. Check country headers (Cloudflare, Vercel, CloudFront, etc.)
    const country = (
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cloudfront-viewer-country') ||
      request.headers.get('x-country-code')
    )?.toUpperCase()

    if (country) {
      // Spanish speaking countries
      const esCountries = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ']
      // Chinese speaking countries/regions
      const zhCountries = ['CN', 'TW', 'HK', 'MO', 'SG']
      // French speaking countries (major ones)
      const frCountries = ['FR', 'BE', 'CH', 'LU', 'MC', 'SN', 'CD', 'CI', 'MG', 'CM', 'NE', 'BF', 'ML']
      // English speaking countries (major ones)
      const enCountries = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'IN', 'PH', 'PK', 'NG']

      if (esCountries.includes(country)) {
        detectedLocale = 'es'
      } else if (zhCountries.includes(country)) {
        detectedLocale = 'zh'
      } else if (frCountries.includes(country)) {
        detectedLocale = 'fr'
      } else if (enCountries.includes(country)) {
        detectedLocale = 'en'
      }
    }

    // 2. Fallback to Accept-Language header
    if (!detectedLocale) {
      const acceptLanguage = request.headers.get('accept-language') || ''
      const parsedLanguages = acceptLanguage
        .split(',')
        .map(lang => {
          const parts = lang.trim().split(';q=')
          const code = parts[0].split('-')[0].toLowerCase()
          const q = parts[1] ? parseFloat(parts[1]) : 1.0
          return { code, priority: q }
        })
        .sort((a, b) => b.priority - a.priority)

      const matchedLang = parsedLanguages.find(lang => locales.includes(lang.code))
      if (matchedLang) {
        detectedLocale = matchedLang.code
      }
    }

    targetLocale = detectedLocale || defaultLocale
  } else {
    // Mode: Forced language (e.g. 'fr', 'en', 'es', 'zh')
    targetLocale = locales.includes(configLocale) ? configLocale : defaultLocale
  }

  // 1. Enforce clean URL: if user visits explicit DEFAULT_LOCALE path, redirect to prefix-free path
  if (pathname === `/${targetLocale}`) {
    return NextResponse.redirect(new URL('/', request.url), 301)
  }
  if (pathname.startsWith(`/${targetLocale}/`)) {
    const cleanPath = pathname.substring(targetLocale.length + 1)
    return NextResponse.redirect(new URL(cleanPath, request.url), 301)
  }

  // 2. Check if pathname has another active locale prefix (e.g. /fr/..., /en/..., /zh/...)
  const otherLocales = locales.filter(l => l !== targetLocale)
  const pathnameHasOtherLocale = otherLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasOtherLocale) {
    return NextResponse.next()
  }

  // 3. Rewrite root-level paths internally to targetLocale (e.g. / -> /es, /legal -> /es/legal)
  const url = request.nextUrl.clone()
  url.pathname = `/${targetLocale}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
