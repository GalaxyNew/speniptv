export interface ButtonValue {
  text: string
  actionType: 'whatsapp' | 'anchor' | 'page' | 'url'
  actionTarget: string
  whatsappMsg?: string
  href?: string
  font?: string
  gradient?: string
}

export function parseButtonValue(rawStr: string | undefined | null): ButtonValue {
  if (!rawStr) {
    return { text: '', actionType: 'whatsapp', actionTarget: '', whatsappMsg: '' }
  }

  try {
    if (typeof rawStr === 'string' && rawStr.trim().startsWith('{') && rawStr.trim().endsWith('}')) {
      const parsed = JSON.parse(rawStr)
      if (parsed && typeof parsed === 'object' && 'text' in parsed) {
        return {
          text: parsed.text || '',
          actionType: parsed.actionType || (parsed.href ? (parsed.href.startsWith('#') ? 'anchor' : 'url') : 'whatsapp'),
          actionTarget: parsed.actionTarget || parsed.href || '',
          whatsappMsg: parsed.whatsappMsg || '',
          href: parsed.href || '',
          font: parsed.font || '',
          gradient: parsed.gradient || '',
        }
      }
    }
  } catch (e) {}

  return {
    text: String(rawStr),
    actionType: 'whatsapp',
    actionTarget: '',
    whatsappMsg: '',
  }
}

import { publicPath } from './seo'

export function getButtonLinkProps(
  buttonValueObj: ButtonValue,
  locale: string,
  settings: any
) {
  const { actionType, actionTarget, whatsappMsg } = buttonValueObj

  if (actionType === 'whatsapp') {
    const waNumber = settings?.whatsappNumber ?? ''
    const waMsg = whatsappMsg || settings?.[`whatsappMsg_${locale}`] || ''
    const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`
    return {
      href: waUrl,
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  }

  if (actionType === 'anchor') {
    const targetStr = actionTarget.trim()
    const href = targetStr.startsWith('#') ? targetStr : `#${targetStr}`
    return {
      href,
    }
  }

  if (actionType === 'page') {
    const target = actionTarget.trim().replace(/^\//, '')
    const href = publicPath(locale, `/${target}`)
    return {
      href,
      target: '_blank'
    }
  }

  if (actionType === 'url') {
    let url = actionTarget.trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      url = `https://${url}`
    }
    return {
      href: url || '#',
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  }

  return {
    href: '#'
  }
}
