import { db } from './db'

export function resolveSiteDomain(settingsDomain: string | null | undefined, host?: string | null) {
  if (settingsDomain && settingsDomain.trim() !== '' && settingsDomain !== 'https://example.com') {
    return settingsDomain
  }
  if (host) {
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
    return `${protocol}://${host}`
  }
  return 'https://igoriptv2.com'
}

export async function getMergedSettings(locale: string) {
  const [globalSettings, localeSettings] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 'main' } }),
    db.personalizedSettings.findUnique({ where: { locale } }),
  ])
  
  if (!globalSettings) return null

  // Merged object that defaults to global values if locale-specific is empty/null
  return {
    ...globalSettings,
    activeTheme: localeSettings?.activeTheme || globalSettings.activeTheme,
    activeFont: localeSettings?.activeFont || globalSettings.activeFont,
    brandName: localeSettings?.brandName || globalSettings.brandName,
    brandLogoUrl: localeSettings?.brandLogoUrl || globalSettings.brandLogoUrl,
    whatsappNumber: localeSettings?.whatsappNumber || globalSettings.whatsappNumber,
    whatsappMsg_fr: globalSettings.whatsappMsg_fr,
    whatsappMsg_es: localeSettings?.whatsappMsg || globalSettings.whatsappMsg_es,
    whatsappMsg_en: globalSettings.whatsappMsg_en,
    whatsappMsg_zh: globalSettings.whatsappMsg_zh,
    telegramUrl: localeSettings?.telegramUrl || globalSettings.telegramUrl,
    contactEmail: localeSettings?.contactEmail || globalSettings.contactEmail,
    supportPopupDelay: localeSettings?.supportPopupDelay !== null && localeSettings?.supportPopupDelay !== undefined 
      ? localeSettings.supportPopupDelay 
      : globalSettings.supportPopupDelay,
    googleSiteVerification: localeSettings?.googleSiteVerification || globalSettings.googleSiteVerification,
    bingSiteVerification: localeSettings?.bingSiteVerification || globalSettings.bingSiteVerification,
    showSupportWidget: localeSettings?.showSupportWidget !== undefined && localeSettings?.showSupportWidget !== null
      ? localeSettings.showSupportWidget
      : globalSettings.showSupportWidget,
    faviconUrl: localeSettings?.faviconUrl || globalSettings.faviconUrl,
    googleSearchImageUrl: localeSettings?.googleSearchImageUrl || globalSettings.googleSearchImageUrl,
  }
}
