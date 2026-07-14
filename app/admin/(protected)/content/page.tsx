'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'
import EditableText from '@/components/frontend/EditableText'
import EditableIcon from '@/components/frontend/EditableIcon'
import EditableImage from '@/components/frontend/EditableImage'
import { parseButtonValue, ButtonValue } from '@/lib/button'

interface ContentField {
  moduleId: string
  locale: string
  key: string
  value: string
}

const moduleLabels: Record<string, string> = {
  header: '🗂️ Header 页头与导航',
  hero: '🦸 Hero 主区域',
  authority: '📊 权威数据',
  trial_cta: '💬 立即试用 (Trial CTA)',
  plans_cta: '💰 查看价格 (Plans CTA)',
  pricing: '💰 定价标题',
  features: '⚡ 功能特性',
  how_it_works: 'ℹ️ 如何购买',
  nos_services: '🛠️ 我们的服务',
  content: '🎬 Content 类别展示',
  sports_marquee: '⚽ Sports 体育滚动',
  movies_marquee: '🎬 Movies 电影滚动',
  series_marquee: '📺 Series 剧集滚动',
  devices: '📱 设备兼容',
  testimonials: '⭐ 用户评价',
  temoignages: '💬 用户评价[版本二]',
  faq: '❓ 常见问题',
  support_popup: '💬 客服悬浮弹窗',
  affiliate_links: '🔗 外链列表',
  footer: '🗂️ Footer 页尾版权',
}

const localeLabels = { fr: '🇫🇷 法语', es: '🇪🇸 西班牙语', en: '🇬🇧 英语', zh: '🇨🇳 中文' }

const getFieldLabel = (moduleId: string, key: string): string => {
  if (moduleId === 'header') {
    if (key === 'brand_name') return '品牌名称 (Brand Name)'
    if (key === 'cta_text') return '右侧 CTA 按钮'
    if (key.startsWith('nav_link_')) {
      const idx = key.split('_')[2]
      return `导航链接 ${idx}`
    }
  }

  if (moduleId === 'footer') {
    if (key === 'copyright') return '版权所有 (Copyright)'
    if (key === 'description') return '品牌简短描述 (Description)'
    if (key.startsWith('footer_link_')) {
      const idx = key.split('_')[2]
      return `页尾快捷链接 ${idx}`
    }
  }

  if (moduleId === 'trial_cta' || moduleId === 'plans_cta') {
    if (key === 'btn_text') return '按钮文字'
  }

  if (moduleId === 'pricing') {
    if (key === 'promo_text') return '限时促销横幅文字'
    if (key === 'disclaimer') return '底部续费免责声明'
  }

  if (moduleId === 'support_popup') {
    if (key === 'agent_name') return '客服名字 / 标题'
    if (key === 'desc') return '会话欢迎文本 (对话气泡内容)'
    if (key === 'button_text') return 'WhatsApp 按钮文字'
  }

  if (key === 'badge') return '顶部小徽章'
  if (key === 'title') return '板块大标题'
  if (key === 'subtitle') return '板块副标题'

  if (moduleId === 'nos_services') {
    if (key === 's1_title') return '服务 1 - 标题'
    if (key === 's1_desc') return '服务 1 - 描述'
    if (key === 's1_icon') return '服务 1 - 图标 URL'
    if (key === 's2_title') return '服务 2 - 标题'
    if (key === 's2_desc') return '服务 2 - 描述'
    if (key === 's2_icon') return '服务 2 - 图标 URL'
    if (key === 's3_title') return '服务 3 - 标题'
    if (key === 's3_desc') return '服务 3 - 描述'
    if (key === 's3_icon') return '服务 3 - 图标 URL'
  }

  if (moduleId === 'temoignages') {
    // only badge and title text fields
  }

  if (moduleId === 'hero') {
    if (key === 'h1') return '主标题 H1'
    if (key === 'cta_primary') return '主按钮文字 (试用)'
    if (key === 'cta_secondary') return '副按钮文字 (查看价格)'
    if (key === 'stat_channels') return '数据1 - 数量'
    if (key === 'stat_channels_label') return '数据1 - 标签'
    if (key === 'stat_quality') return '数据2 - 数量'
    if (key === 'stat_quality_label') return '数据2 - 标签'
    if (key === 'stat_uptime') return '数据3 - 数量'
    if (key === 'stat_uptime_label') return '数据3 - 标签'
    if (key === 'stat_trial') return '数据4 - 数量'
    if (key === 'stat_trial_label') return '数据4 - 标签'
  }

  if (moduleId === 'authority') {
    if (key.startsWith('badge_')) {
      const idx = key.split('_')[1]
      return `信任保障徽章 ${idx}`
    }
    if (key.startsWith('s') && key.endsWith('_val')) {
      const idx = key[1]
      return `统计数据 ${idx} - 数值`
    }
    if (key.startsWith('s') && key.endsWith('_lbl')) {
      const idx = key[1]
      return `统计数据 ${idx} - 标签`
    }
  }

  if (moduleId === 'features') {
    if (key.endsWith('_title')) {
      const idx = key[1]
      return `特点 ${idx} - 标题`
    }
    if (key.endsWith('_desc')) {
      const idx = key[1]
      return `特点 ${idx} - 详细描述`
    }
  }

  if (moduleId === 'how_it_works') {
    if (key === 'title') return '板块大标题'
    if (key === 'subtitle') return '板块副标题'
    if (key === 'step1_title') return '步骤 1 - 标题'
    if (key === 'step1_desc') return '步骤 1 - 描述'
    if (key === 'step1_icon') return '步骤 1 - 图标 URL'
    if (key === 'step2_title') return '步骤 2 - 标题'
    if (key === 'step2_desc') return '步骤 2 - 描述'
    if (key === 'step2_icon') return '步骤 2 - 图标 URL'
    if (key === 'step3_title') return '步骤 3 - 标题'
    if (key === 'step3_desc') return '步骤 3 - 描述'
    if (key === 'step3_icon') return '步骤 3 - 图标 URL'
    if (key === 'banner_title') return '横幅 - 大标题'
    if (key === 'banner_desc') return '横幅 - 描述内容'
    if (key === 'banner_image') return '页面横幅展示图片'
    if (key === 'bg_image_url') return '板块背景图片'
  }

  if (moduleId === 'content') {
    if (key.endsWith('_name')) {
      const idx = key[1]
      return `类别 ${idx} - 导航Tab名称`
    }
    if (key.endsWith('_desc')) {
      const idx = key[1]
      return `类别 ${idx} - 板块详情说明`
    }
    if (key === 'card_image_width') return '卡片图片展示宽度 (px)'
    if (key === 'card_image_height') return '卡片图片展示高度 (px)'
  }

  if (moduleId === 'devices') {
    if (key.startsWith('dev') && key.endsWith('_lbl')) {
      const idx = key.replace('dev', '').replace('_lbl', '')
      return `支持设备 ${idx} - 名称`
    }
  }

  if (moduleId === 'testimonials') {
    if (key === 'rating_score') return '平均评分分数 (如 4.9)'
    if (key === 'rating_text') return '平均评分副文本'
    const parts = key.split('_')
    const idx = parts[0]?.replace('r', '')
    const field = parts[1]
    if (field === 'name') return `客户 ${idx} - 姓名`
    if (field === 'city') return `客户 ${idx} - 城市`
    if (field === 'country') return `客户 ${idx} - 国家/地区 (含国旗)`
    if (field === 'date') return `客户 ${idx} - 评价日期`
    if (field === 'title') return `客户 ${idx} - 评价标题`
    if (field === 'text') return `客户 ${idx} - 评价内容`
    if (field === 'image') return `客户 ${idx} - 海报/截图/头像 URL`
  }

  if (moduleId === 'faq') {
    if (key.startsWith('q')) {
      const idx = key.replace('q', '')
      return `常见问题 ${idx} - 问题`
    }
    if (key.startsWith('a')) {
      const idx = key.replace('a', '')
      return `常见问题 ${idx} - 回答`
    }
  }

  return key
}

export default function ContentEditorPage() {
  const { showPermissionAlert } = usePermission()
  const [activeModule, setActiveModule] = useState<string>('hero')
  const [activeLocale, setActiveLocale] = useState<'es'>('es')
  const [fields, setFields] = useState<ContentField[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showVisualEdit, setShowVisualEdit] = useState(true)
  const [activePreviewTab, setActivePreviewTab] = useState(0)
  const [activePricingPreviewTab, setActivePricingPreviewTab] = useState(0)
  const [bgImages, setBgImages] = useState<{ id: string; url: string }[]>([])
  const [howItWorksBgs, setHowItWorksBgs] = useState<{ id: string; url: string }[]>([])
  const [howItWorksBanners, setHowItWorksBanners] = useState<{ id: string; url: string }[]>([])
  const [temoignagesImages, setTemoignagesImages] = useState<{ id: string; url: string }[]>([])
  const [marqueeImages, setMarqueeImages] = useState<{ id: string; url: string; type: string }[]>([])
  const [moduleBgs, setModuleBgs] = useState<{ id: string; url: string; moduleId: string }[]>([])
  const [subpages, setSubpages] = useState<{ id: string; slug: string; title: string; locale: string }[]>([])
  const [systemModules, setSystemModules] = useState<{ id: string }[]>([])

  // Sync sessionStorage and URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      let moduleVal = params.get('module')
      let localeVal = params.get('locale')

      if (!moduleVal) {
        moduleVal = sessionStorage.getItem('admin_active_module') || 'hero'
        params.set('module', moduleVal)
      }
      if (!localeVal) {
        localeVal = sessionStorage.getItem('admin_active_locale') || 'es'
        params.set('locale', localeVal)
      }
      
      sessionStorage.setItem('admin_active_module', moduleVal)
      sessionStorage.setItem('admin_active_locale', localeVal)
      
      window.history.replaceState(null, '', `?${params.toString()}`)
      
      setActiveModule(moduleVal)
      setActiveLocale(localeVal as any)
    }

    fetch('/api/admin/subpages')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSubpages(data))
      .catch(err => console.error('Failed to load subpages:', err))

    fetch('/api/admin/modules')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSystemModules(data))
      .catch(err => console.error('Failed to load system modules:', err))
  }, [])

  const changeModule = (id: string) => {
    setActiveModule(id)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_active_module', id)
      const params = new URLSearchParams(window.location.search)
      params.set('module', id)
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }

  const changeLocale = (loc: 'es') => {
    setActiveLocale(loc)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_active_locale', loc)
      const params = new URLSearchParams(window.location.search)
      params.set('locale', loc)
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }

  useEffect(() => {
    loadContent()
  }, [activeModule, activeLocale])

  useEffect(() => {
    if (activeModule === 'hero') {
      fetch('/api/admin/hero-bgs')
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setBgImages(data) })
        .catch(err => console.error('Failed to load hero background images:', err))
    } else if (activeModule === 'how_it_works') {
      fetch('/api/admin/how-it-works-bgs?type=background')
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setHowItWorksBgs(data) })
        .catch(err => console.error('Failed to load how_it_works background images:', err))

      fetch('/api/admin/how-it-works-bgs?type=banner')
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setHowItWorksBanners(data) })
        .catch(err => console.error('Failed to load how_it_works banner images:', err))
    } else if (activeModule === 'temoignages') {
      fetch(`/api/admin/temoignages-images?locale=${activeLocale}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setTemoignagesImages(data) })
        .catch(err => console.error('Failed to load temoignages images:', err))
    } else if (['sports_marquee', 'movies_marquee', 'series_marquee'].includes(activeModule)) {
      const type = activeModule.replace('_marquee', '')
      fetch(`/api/admin/marquee-images?type=${type}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setMarqueeImages(data) })
        .catch(err => console.error('Failed to load marquee images:', err))
    }

    if (activeModule !== 'hero' && activeModule !== 'how_it_works') {
      fetch(`/api/admin/module-bgs?moduleId=${activeModule}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setModuleBgs(data) })
        .catch(err => console.error(`Failed to load background images for ${activeModule}:`, err))
    }
  }, [activeModule, activeLocale])

  const loadContent = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/content?moduleId=${activeModule}&locale=${activeLocale}&t=${Date.now()}`, {
      cache: 'no-store'
    })
    const data = await res.json()
    setFields(data)
    setLoading(false)
  }

  const ensureMarqueeImagesImported = async (type: string) => {
    if (marqueeImages.length > 0) return marqueeImages

    const defaultCount = type === 'sports' ? 14 : 30
    const urls = Array.from({ length: defaultCount }, (_, i) => `/images/${type}/${i + 1}.webp`)
    
    const res = await fetch('/api/admin/marquee-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, urls }),
    })
    const json = await res.json()
    if (json.ok) {
      const r = await fetch(`/api/admin/marquee-images?type=${type}`)
      const data = r.ok ? await r.json() : []
      if (Array.isArray(data)) {
        setMarqueeImages(data)
        return data
      }
    }
    return []
  }

  const handleUploadMarqueeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = activeModule.replace('_marquee', '')
    
    let currentImages = marqueeImages
    if (currentImages.length === 0) {
      currentImages = await ensureMarqueeImagesImported(type)
    }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch('/api/admin/marquee-images', { method: 'POST', body: fd })
    const json = await res.json()
    if (json.ok) {
      setMarqueeImages([...currentImages, json.data])
    }
    e.target.value = ''
  }

  const handleDeleteMarqueeImage = async (id: string, url?: string, isDefault?: boolean) => {
    if (!confirm('确认删除此图片？')) return
    const type = activeModule.replace('_marquee', '')

    if (isDefault && url) {
      const defaultCount = type === 'sports' ? 14 : 30
      const urlsToImport = Array.from({ length: defaultCount }, (_, i) => `/images/${type}/${i + 1}.webp`)
        .filter(u => u !== url)

      const res = await fetch('/api/admin/marquee-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, urls: urlsToImport }),
      })
      const json = await res.json()
      if (json.ok) {
        const r = await fetch(`/api/admin/marquee-images?type=${type}`)
        const data = r.ok ? await r.json() : []
        if (Array.isArray(data)) setMarqueeImages(data)
      }
    } else {
      await fetch('/api/admin/marquee-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setMarqueeImages(prev => prev.filter(img => img.id !== id))
    }
  }

  const parseJsonValue = (rawStr: string) => {
    try {
      if (typeof rawStr === 'string' && rawStr.trim().startsWith('{') && rawStr.trim().endsWith('}')) {
        const parsed = JSON.parse(rawStr)
        if (parsed && typeof parsed === 'object' && 'text' in parsed) {
          return {
            text: parsed.text || '',
            href: parsed.href || '',
            font: parsed.font || '',
            gradient: parsed.gradient || '',
          }
        }
      }
    } catch (e) {}
    return {
      text: rawStr || '',
      href: '',
      font: '',
      gradient: '',
    }
  }

  const saveField = async (key: string, value: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeModule, locale: activeLocale, key, value }),
      })
      if (res.status === 403) {
        showPermissionAlert()
        return
      }
      if (!res.ok) {
        alert('保存失败，请重试')
        return
      }
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
      setFields(prev => {
        const exists = prev.some(f => f.key === key)
        if (exists) {
          return prev.map(f => f.key === key ? { ...f, value } : f)
        } else {
          return [...prev, { moduleId: activeModule, locale: activeLocale, key, value }]
        }
      })
    } catch (err) {
      console.error(err)
      alert('保存失败，请重试')
    } finally {
      setSaving(null)
    }
  }

  const updateLocalField = (key: string, value: string) => {
    setFields(prev => {
      const exists = prev.some(f => f.key === key)
      if (exists) {
        return prev.map(f => f.key === key ? { ...f, value } : f)
      } else {
        return [...prev, { moduleId: activeModule, locale: activeLocale, key, value }]
      }
    })
  }

  const onButtonPropChange = (fieldKey: string, prop: 'text' | 'actionType' | 'actionTarget' | 'whatsappMsg', newVal: string) => {
    const currentField = fields.find(f => f.key === fieldKey)
    const currentVal = parseButtonValue(currentField?.value ?? '')
    
    const updated: any = {
      ...currentVal,
      [prop]: newVal
    }
    
    if (prop === 'actionType') {
      if (newVal === 'anchor') {
        updated.actionTarget = 'pricing'
      } else if (newVal === 'page') {
        const firstPage = subpages.filter(p => p.locale === activeLocale)[0];
        updated.actionTarget = firstPage ? firstPage.slug : ''
      } else if (newVal === 'whatsapp') {
        updated.actionTarget = ''
      } else if (newVal === 'url') {
        updated.actionTarget = ''
      }
    }

    if (updated.actionType === 'anchor') {
      updated.href = updated.actionTarget.startsWith('#') ? updated.actionTarget : `#${updated.actionTarget}`
    } else if (updated.actionType === 'url') {
      updated.href = updated.actionTarget
    } else if (updated.actionType === 'page') {
      updated.href = `/${activeLocale}/${updated.actionTarget}`
    } else {
      updated.href = ''
    }

    const stringified = JSON.stringify(updated)
    updateLocalField(fieldKey, stringified)
  }

  const saveButtonPropChange = (fieldKey: string, prop: 'text' | 'actionType' | 'actionTarget' | 'whatsappMsg', newVal: string) => {
    const currentField = fields.find(f => f.key === fieldKey)
    const currentVal = parseButtonValue(currentField?.value ?? '')
    
    const updated: any = {
      ...currentVal,
      [prop]: newVal
    }

    if (prop === 'actionType') {
      if (newVal === 'anchor') {
        updated.actionTarget = 'pricing'
      } else if (newVal === 'page') {
        const firstPage = subpages.filter(p => p.locale === activeLocale)[0];
        updated.actionTarget = firstPage ? firstPage.slug : ''
      } else if (newVal === 'whatsapp') {
        updated.actionTarget = ''
      } else if (newVal === 'url') {
        updated.actionTarget = ''
      }
    }

    if (updated.actionType === 'anchor') {
      updated.href = updated.actionTarget.startsWith('#') ? updated.actionTarget : `#${updated.actionTarget}`
    } else if (updated.actionType === 'url') {
      updated.href = updated.actionTarget
    } else if (updated.actionType === 'page') {
      updated.href = `/${activeLocale}/${updated.actionTarget}`
    } else {
      updated.href = ''
    }

    const stringified = JSON.stringify(updated)
    saveField(fieldKey, stringified)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '0.5rem',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    resize: 'vertical',
  }

  const c = Object.fromEntries(fields.map(f => [f.key, f.value]))

  // Helper to render inline editable inputs inside the visual preview pane
  const renderEditableInput = (fieldKey: string, style: React.CSSProperties, isTextArea: boolean = false, rows: number = 2) => {
    const val = c[fieldKey] ?? ''
    const defaultPlaceholder = getFieldLabel(activeModule, fieldKey)

    const handleSave = (newValue: string) => {
      setFields(prev => {
        const exists = prev.some(f => f.key === fieldKey)
        if (exists) {
          return prev.map(f => f.key === fieldKey ? { ...f, value: newValue } : f)
        } else {
          return [...prev, { moduleId: activeModule, locale: activeLocale, key: fieldKey, value: newValue }]
        }
      })
    }

    return (
      <EditableText
        key={`${activeModule}-${activeLocale}-${fieldKey}`}
        moduleId={activeModule}
        locale={activeLocale}
        fieldKey={fieldKey}
        isEditMode={true}
        style={{
          ...style,
          display: 'inline-block',
          width: '100%',
        }}
        multiline={isTextArea}
        placeholder={defaultPlaceholder}
        onSave={handleSave}
        onPermissionDenied={showPermissionAlert}
      >
        {val}
      </EditableText>
    )
  }

  const renderVisualPreview = () => {
    const wrapPreviewWithBg = (content: React.ReactNode, isAltBg: boolean = false) => {
      const showBgImage = c.show_bg_image !== 'false'
      const bgImage = c.bg_image_url || ''
      const bgBlur = c.bg_blur ? parseFloat(c.bg_blur) : 0
      const bgOverlayOpacity = c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.85
      const displayBg = showBgImage && bgImage

      return (
        <div style={{
          padding: '2rem 1rem',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          position: 'relative',
          overflow: 'hidden',
          background: displayBg ? 'transparent' : (isAltBg ? 'var(--section-alt-bg)' : 'var(--bg-primary)'),
        }}>
          {displayBg && (
            <div style={{
              position: 'absolute',
              top: `-${bgBlur * 2}px`,
              left: `-${bgBlur * 2}px`,
              right: `-${bgBlur * 2}px`,
              bottom: `-${bgBlur * 2}px`,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: `blur(${bgBlur}px)`,
              zIndex: 0,
            }} />
          )}
          {displayBg && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'var(--bg-primary)',
              opacity: bgOverlayOpacity,
              zIndex: 1,
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {content}
          </div>
        </div>
      )
    }

    if (activeModule === 'hero') {
      const bgImageUrl = c.bg_image_url || ''
      const layoutMode = c.layout_mode || 'center'
      const showBgImage = c.show_bg_image !== 'false'
      const bgBlur = c.bg_blur ? parseFloat(c.bg_blur) : 0
      const bgOverlayOpacity = c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.55
      const displayBg = showBgImage && bgImageUrl
      return (
        <div style={{
          minHeight: '420px',
          display: 'flex',
          alignItems: layoutMode === 'left' ? 'flex-start' : 'center',
          background: displayBg ? 'transparent' : 'var(--hero-gradient)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0.75rem',
          paddingLeft: layoutMode === 'left' ? '10%' : '1rem',
          paddingRight: layoutMode === 'left' ? '10%' : '1rem',
          paddingTop: layoutMode === 'left' ? '10%' : '2.5rem',
          paddingBottom: layoutMode === 'left' ? '10%' : '2.5rem',
        }}>
          {/* Background Image Layer with blur */}
          {displayBg && (
            <div style={{
              position: 'absolute',
              top: `-${bgBlur * 2}px`,
              left: `-${bgBlur * 2}px`,
              right: `-${bgBlur * 2}px`,
              bottom: `-${bgBlur * 2}px`,
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: `blur(${bgBlur}px)`,
              zIndex: 0,
            }} />
          )}

          {/* Background decoration / tint overlay */}
          {displayBg ? (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundColor: '#0f172a',
              opacity: bgOverlayOpacity,
              zIndex: 0,
            }} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.12) 0%, transparent 60%)',
              zIndex: 0,
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <div className="hero-content-card" style={{
              width: layoutMode === 'left' ? '100%' : '60%',
              maxWidth: layoutMode === 'left' ? '500px' : 'none',
              margin: layoutMode === 'left' ? '0' : '0 auto',
              textAlign: layoutMode === 'left' ? 'left' : 'center',
            }}>
              {/* Badge */}
              <div style={{ marginBottom: '1rem' }}>
                <span className="badge" style={{ display: 'inline-flex' }}>
                  {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
                </span>
              </div>

              {/* H1 */}
              <div style={{ marginBottom: '1rem' }}>
                {renderEditableInput('h1', {
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  fontFamily: 'Outfit, Inter, sans-serif',
                  lineHeight: 1.2,
                  color: 'var(--text-primary)',
                  textAlign: layoutMode === 'left' ? 'left' : 'center',
                }, true, 2)}
              </div>

              {/* Subtitle */}
              <div style={{ marginBottom: '1.5rem' }}>
                {renderEditableInput('subtitle', {
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  textAlign: layoutMode === 'left' ? 'left' : 'center',
                }, true, 2)}
              </div>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', justifyContent: layoutMode === 'left' ? 'flex-start' : 'center', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <div className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  {renderEditableInput('cta_secondary', { color: 'var(--text-primary)', fontWeight: 600, width: '80px' })}
                </div>
                <div className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  💬 {renderEditableInput('cta_primary', { color: 'white', fontWeight: 600, width: '90px' })}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  padding: '1rem 0',
                  width: '100%',
                  maxWidth: '500px',
                  margin: layoutMode === 'left' ? '0' : '0 auto',
                }}
              >
                {[
                  { val: 'stat_channels', lbl: 'stat_channels_label' },
                  { val: 'stat_quality', lbl: 'stat_quality_label' },
                  { val: 'stat_uptime', lbl: 'stat_uptime_label' },
                  { val: 'stat_trial', lbl: 'stat_trial_label' },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: layoutMode === 'left' ? 'left' : 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-1)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                      {renderEditableInput(stat.val, { fontWeight: 800, color: 'var(--accent-1)', textAlign: layoutMode === 'left' ? 'left' : 'center' })}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
                      {renderEditableInput(stat.lbl, { color: 'var(--text-secondary)', textAlign: layoutMode === 'left' ? 'left' : 'center' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeModule === 'authority') {
      const badgeKeys = ['badge_1', 'badge_2', 'badge_3', 'badge_4']
      const statKeys = [
        { val: 's1_val', lbl: 's1_lbl' },
        { val: 's2_val', lbl: 's2_lbl' },
        { val: 's3_val', lbl: 's3_lbl' },
        { val: 's4_val', lbl: 's4_lbl' },
      ]

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--section-alt-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2rem', textAlign: 'center' }}>
            {statKeys.map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-1)', fontFamily: 'Outfit, sans-serif' }}>
                  {renderEditableInput(stat.val, { fontWeight: 900, color: 'var(--accent-1)', textAlign: 'center' })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
                  {renderEditableInput(stat.lbl, { color: 'var(--text-secondary)', textAlign: 'center' })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {badgeKeys.map((key) => (
              <span key={key} className="badge" style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                {renderEditableInput(key, { color: 'var(--accent-1)', display: 'inline-block', width: 'auto' })}
              </span>
            ))}
          </div>
        </div>
      )
    }

    if (activeModule === 'pricing') {
      const pricingTiers = [
        { fr: '1 Écran', es: '1 Pantalla', en: '1 Screen' },
        { fr: '2 Écrans', es: '2 Pantallas', en: '2 Screens' },
        { fr: '3 Écrans', es: '3 Pantallas', en: '3 Screens' },
      ]
      const tierPrices = [
        { '1 Mois': '7.99', '3 Mois': '14.99', '12 Mois': '39.99' },
        { '1 Mois': '11.99', '3 Mois': '24.99', '12 Mois': '64.99' },
        { '1 Mois': '14.99', '3 Mois': '34.99', '12 Mois': '89.99' },
      ]

      const activePrices = tierPrices[activePricingPreviewTab] ?? tierPrices[0]
      const isImageMode = c.price_mode === 'image'
      const pricingImageUrl = c.pricing_image_url ?? ''

      return (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          {/* Promo Banner */}
          <div style={{
            textAlign: 'center',
            background: 'rgba(163, 230, 53, 0.05)',
            border: '1px dashed rgba(163, 230, 53, 0.25)',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            color: '#a3e635',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}>
            <span>⚡</span>
            <span>{renderEditableInput('promo_text', { fontWeight: 700, color: '#a3e635', display: 'inline-block' })}</span>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          {isImageMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ maxWidth: '100%', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden', padding: pricingImageUrl ? '0' : '2rem', background: 'rgba(255,255,255,0.02)' }}>
                {pricingImageUrl ? (
                  <img src={pricingImageUrl} alt="Pricing" style={{ width: '100%', height: 'auto', display: 'block' }} />
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    🖼️ 暂无价格表图片，请在侧边栏上传
                  </div>
                )}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'var(--btn-primary-bg, #25d366)',
                color: 'var(--btn-primary-text, #ffffff)',
                borderRadius: '2rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: 'var(--btn-primary-shadow, 0 4px 12px rgba(37, 211, 102, 0.25))',
              }}>
                <span>💬</span>
                <span>{renderEditableInput('cta_text', { fontWeight: 700, color: '#ffffff', display: 'inline-block' })}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Pricing Tabs switcher mock */}
              <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {pricingTiers.map((t, idx) => {
                  const name = t[activeLocale as keyof typeof t] || t.en
                  const isActive = activePricingPreviewTab === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => setActivePricingPreviewTab(idx)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '2rem',
                        border: isActive ? 'none' : '1px solid var(--border-color)',
                        background: isActive ? 'var(--btn-primary-bg)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>

              {/* Dummy pricing list preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {Object.entries(activePrices).map(([dur, pr], i) => {
                  const colors = [
                    { bg: '#ffffff', text: '#090d16' },
                    { bg: '#c8e6ff', text: '#1e3a8a' },
                    { bg: '#ffe4cc', text: '#7c2d12' },
                  ]
                  const cB = colors[i % colors.length]
                  return (
                    <div key={i} className="card" style={{ padding: '0.875rem', border: i === 1 ? '1px solid var(--accent-1)' : '1px solid var(--border-color)', background: 'var(--bg-card)', backdropFilter: 'var(--card-backdrop)', borderRadius: '0.5rem', textAlign: 'left' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-1)', fontFamily: 'Outfit, sans-serif' }}>{dur}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.25rem 0', fontFamily: 'Outfit, sans-serif' }}>€{pr}</div>
                      <div style={{ background: cB.bg, color: cB.text, borderRadius: '1rem', fontSize: '0.625rem', padding: '0.25rem', fontWeight: 800, textAlign: 'center' }}>💬 WhatsApp</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
            {renderEditableInput('disclaimer', { color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.65rem' })}
          </div>
        </div>
      )
    }

    if (activeModule === 'features') {
      const fKeys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6']
      const fIcons = ['📺', '⚡', '📱', '🎬', '⚽', '🎧']

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {fKeys.map((key, i) => {
              const defaultIcon = i === 0 ? 'Tv' : i === 1 ? 'Zap' : i === 2 ? 'Smartphone' : i === 3 ? 'Film' : i === 4 ? 'Trophy' : 'Headphones'
              return (
                <div key={key} className="card" style={{ padding: '0.875rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'var(--card-backdrop)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div className="themed-icon-wrap" style={{ marginBottom: '0.75rem' }}>
                    <EditableIcon
                      moduleId="features"
                      locale={activeLocale}
                      fieldKey={`${key}_icon`}
                      iconValue={c[`${key}_icon`] ?? defaultIcon}
                      iconSizeValue={c[`${key}_icon_size`]}
                      iconColorValue={c[`${key}_icon_color`]}
                      defaultIcon={defaultIcon}
                      defaultSize={24}
                      defaultColor={i % 2 === 0 ? "var(--accent-1)" : "var(--accent-2)"}
                      isEditMode={true}
                      onPermissionDenied={showPermissionAlert}
                    />
                  </div>
                  {renderEditableInput(`${key}_title`, { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif' })}
                  {renderEditableInput(`${key}_desc`, { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem', lineHeight: 1.4 }, true, 2)}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (activeModule === 'how_it_works') {
      const steps = [
        { num: '01', titleKey: 'step1_title', descKey: 'step1_desc', iconKey: 'step1_icon', defaultIcon: 'Tv' },
        { num: '02', titleKey: 'step2_title', descKey: 'step2_desc', iconKey: 'step2_icon', defaultIcon: 'Smartphone' },
        { num: '03', titleKey: 'step3_title', descKey: 'step3_desc', iconKey: 'step3_icon', defaultIcon: 'Play' },
      ]

      const showBgImage = c.show_bg_image !== 'false'
      const bgImage = c.bg_image_url || '/images/sports_stadium_bg.webp'
      const bgBlur = c.bg_blur ? parseFloat(c.bg_blur) : 0
      const bgOverlayOpacity = c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.85

      return (
        <div style={{
          padding: '2rem 1rem',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          position: 'relative',
          overflow: 'hidden',
          background: showBgImage ? 'transparent' : 'var(--bg-primary)',
        }}>
          {/* Background Layer with blur */}
          {showBgImage && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: `blur(${bgBlur}px)`,
              transform: bgBlur > 0 ? 'scale(1.08)' : 'none',
              zIndex: 0,
            }} />
          )}
          {/* Dark Overlay Layer */}
          {showBgImage && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: '#0f172a',
              opacity: bgOverlayOpacity,
              zIndex: 1,
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="badge" style={{ display: 'inline-block' }}>
                  {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
                </span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
              </div>
              {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
            </div>

            {/* Steps Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
              {steps.map((s, idx) => (
                <div key={idx} className="card step-card" style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', textAlign: 'center', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-1)', marginBottom: '0.5rem' }}>{s.num}</div>
                  
                  <div className="step-icon-wrap" style={{ margin: '0 auto 1rem' }}>
                    <EditableIcon
                      moduleId="how_it_works"
                      locale={activeLocale}
                      fieldKey={s.iconKey}
                      iconValue={c[s.iconKey] ?? s.defaultIcon}
                      iconSizeValue={c[s.iconKey + '_size']}
                      iconColorValue={c[s.iconKey + '_color']}
                      defaultIcon={s.defaultIcon}
                      defaultSize={32}
                      defaultColor={idx % 2 === 0 ? 'var(--accent-1)' : 'var(--accent-2)'}
                      isEditMode={true}
                      onPermissionDenied={showPermissionAlert}
                    />
                  </div>

                  <div style={{ marginBottom: '0.375rem' }}>
                    {renderEditableInput(s.titleKey, { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'Outfit, sans-serif' })}
                  </div>
                  {renderEditableInput(s.descKey, { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }, true, 2)}
                </div>
              ))}
            </div>

            {/* Large Sports Banner */}
            <div style={{ marginTop: '2rem', position: 'relative' }}>
              {/* Header block with visibility status and quick toggle button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-color)',
                borderBottom: 'none',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
              }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: c.show_banner !== 'false' ? '#10b981' : '#f87171' }}>
                  {c.show_banner !== 'false' ? '🟢 体育横幅模块 - 已启用显示' : '🔴 体育横幅模块 - 已隐藏'}
                </span>
                <button
                  onClick={() => saveField('show_banner', c.show_banner !== 'false' ? 'false' : 'true')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: c.show_banner !== 'false' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 211, 238, 0.2)',
                    border: '1px solid ' + (c.show_banner !== 'false' ? '#ef4444' : '#22d3ee'),
                    borderRadius: '0.375rem',
                    color: c.show_banner !== 'false' ? '#f87171' : '#22d3ee',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {c.show_banner !== 'false' ? '隐藏模块' : '显示模块'}
                </button>
              </div>

              {c.show_banner !== 'false' ? (
                <div className="card" style={{
                  padding: '1.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  background: 'var(--bg-card)',
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      {renderEditableInput('banner_title', { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' })}
                    </div>
                    {renderEditableInput('banner_desc', { fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }, true, 3)}
                  </div>
                  <div>
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}>
                      <img
                        src={c.banner_image || '/images/sports_collage.png'}
                        alt="Sports and movies collage banner"
                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '2rem 1.5rem',
                  border: '1px dashed var(--border-color)',
                  background: 'rgba(15, 23, 42, 0.3)',
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}>
                  横幅已隐藏，前台页面将不再展示该板块内容。点击右上角“显示模块”即可重新启用。
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (activeModule === 'content') {
      const tabKeys = ['t1', 't2', 't3', 't4']
      const tabIcons = ['⚽', '🎬', '🌍', '👶']
      const cardImgWidth = parseInt(c.card_image_width || '250', 10)
      const cardImgHeight = parseInt(c.card_image_height || '250', 10)

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--section-alt-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          {/* Interactive tabs mock */}
          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {tabKeys.map((key, idx) => (
              <button
                key={key}
                onClick={() => setActivePreviewTab(idx)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  borderRadius: '2rem',
                  border: activePreviewTab === idx ? 'none' : '1px solid var(--border-color)',
                  background: activePreviewTab === idx ? 'var(--btn-primary-bg)' : 'transparent',
                  color: activePreviewTab === idx ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>{tabIcons[idx]}</span>
                {renderEditableInput(`${key}_name`, { color: 'inherit', fontWeight: 'inherit', width: 'auto', display: 'inline-block' })}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)', backdropFilter: 'var(--card-backdrop)', marginBottom: '1.5rem' }}>
            {renderEditableInput(`${tabKeys[activePreviewTab]}_desc`, { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }, true, 2)}
          </div>

          {/* Cards Grid Preview with Editable Images/Texts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}>
            {Array.from({ length: 4 }).map((_, i) => {
              const cardIdx = i + 1
              const tabKey = tabKeys[activePreviewTab]
              const cardKey = `${tabKey}_c${cardIdx}`
              const imgSrc = c[`${cardKey}_image`] || `/uploads/showcase/${tabKey}_c${cardIdx}.jpg`

              return (
                <div key={i} className="card" style={{ padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontSize: '0.75rem', overflow: 'hidden' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: `${cardImgWidth}px`,
                    aspectRatio: `${cardImgWidth} / ${cardImgHeight}`,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                  }}>
                    <EditableImage
                      moduleId="content"
                      locale={activeLocale}
                      fieldKey={`${cardKey}_image`}
                      src={imgSrc}
                      alt="Category card cover"
                      width={cardImgWidth}
                      height={cardImgHeight}
                      isEditMode={true}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.25rem', width: '100%' }}>
                    {renderEditableInput(`${cardKey}_title`, { fontWeight: 700, color: 'var(--accent-1)', fontSize: '0.8125rem', fontFamily: 'Outfit, sans-serif' })}
                  </div>
                  {renderEditableInput(`${cardKey}_desc`, { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }, true, 2)}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (activeModule === 'devices') {
      const defaultIcons = ['Tv', 'Smartphone', 'Apple', 'Laptop', 'Flame', 'Gamepad2', 'Clapperboard', 'Wifi']
      const devKeys = Array.from({ length: 8 }).map((_, i) => `dev${i + 1}_lbl`)

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {devKeys.map((key, i) => {
              const iconKey = `dev${i + 1}_icon`
              const defaultIcon = defaultIcons[i]
              return (
                <div key={key} className="card" style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'var(--card-backdrop)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="themed-icon-wrap" style={{ marginBottom: '0.5rem' }}>
                    <EditableIcon
                      moduleId="devices"
                      locale={activeLocale}
                      fieldKey={iconKey}
                      iconValue={c[iconKey] ?? defaultIcon}
                      iconSizeValue={c[iconKey + '_size']}
                      iconColorValue={c[iconKey + '_color']}
                      defaultIcon={defaultIcon}
                      defaultSize={24}
                      defaultColor={i % 2 === 0 ? 'var(--accent-1)' : 'var(--accent-2)'}
                      isEditMode={true}
                      onPermissionDenied={showPermissionAlert}
                    />
                  </div>
                {renderEditableInput(key, { fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.25rem' })}
              </div>
            )
          })}
          </div>
        </div>
      )
    }

    if (activeModule === 'testimonials') {
      const revKeys = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--section-alt-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
            </div>
            {/* Rating score inputs */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', maxWidth: '400px', margin: '0 auto' }}>
              <strong>评分:</strong>
              {renderEditableInput('rating_score', { fontWeight: 700, width: '40px', color: 'var(--text-primary)', textAlign: 'center' })}
              <strong>副文本:</strong>
              {renderEditableInput('rating_text', { width: '200px', color: 'var(--text-secondary)' })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {revKeys.map((key, i) => (
              <div key={key} className="card" style={{ padding: '0.875rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'var(--card-backdrop)', fontSize: '0.75rem' }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>姓名:</span>
                    {renderEditableInput(`${key}_name`, { color: 'var(--text-primary)', fontWeight: 'bold' })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>城市:</span>
                    {renderEditableInput(`${key}_city`, { color: 'var(--text-secondary)', width: '70px' })}
                    <span style={{ color: 'var(--text-secondary)' }}>国家/国旗:</span>
                    {renderEditableInput(`${key}_country`, { color: 'var(--text-secondary)', width: '70px' })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>日期:</span>
                    {renderEditableInput(`${key}_date`, { color: 'var(--text-muted)' })}
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>标题:</span>
                    {renderEditableInput(`${key}_title`, { color: 'var(--text-primary)', fontWeight: 'bold' })}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>图片 URL:</span>
                    {renderEditableInput(`${key}_image`, { color: 'var(--text-muted)', fontSize: '0.65rem' })}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                  <span style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>评价正文:</span>
                  {renderEditableInput(`${key}_text`, { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }, true, 3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activeModule === 'nos_services') {
      const services = [
        { prefix: 's1', iconKey: 's1_icon', defaultIcon: 'Globe', defaultColor: 'var(--service-icon-1)', defaultBg: 'var(--service-icon-1-bg)' },
        { prefix: 's2', iconKey: 's2_icon', defaultIcon: 'ShieldCheck', defaultColor: 'var(--service-icon-2)', defaultBg: 'var(--service-icon-2-bg)' },
        { prefix: 's3', iconKey: 's3_icon', defaultIcon: 'Tv', defaultColor: 'var(--service-icon-3)', defaultBg: 'var(--service-icon-3-bg)' },
      ]

      return wrapPreviewWithBg(
        <>
          {/* Header Area */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          {/* Services Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {services.map((svc, i) => (
              <div key={i} className="card" style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  background: svc.defaultBg,
                  color: svc.defaultColor
                }}>
                  <EditableIcon
                    moduleId="nos_services"
                    locale={activeLocale}
                    fieldKey={svc.iconKey}
                    iconValue={c[svc.iconKey] ?? svc.defaultIcon}
                    iconSizeValue={c[svc.iconKey + '_size']}
                    iconColorValue={c[svc.iconKey + '_color']}
                    defaultIcon={svc.defaultIcon}
                    defaultSize={24}
                    defaultColor={svc.defaultColor}
                    isEditMode={true}
                    onPermissionDenied={showPermissionAlert}
                  />
                </div>
                <div style={{ marginBottom: '0.375rem', width: '100%' }}>
                  {renderEditableInput(`${svc.prefix}_title`, { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif' })}
                </div>
                {renderEditableInput(`${svc.prefix}_desc`, { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }, true, 2)}
              </div>
            ))}
          </div>
        </>
      )
    }

    if (activeModule === 'temoignages') {
      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', textAlign: 'center' }}>
          {/* Header Area */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge" style={{ display: 'inline-block' }}>
                {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
            </div>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>

          {/* Testimonial screenshots horizontal track preview */}
          {temoignagesImages.length === 0 ? (
            <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              暂无截图。请在左侧上传客户见证截图。
            </div>
          ) : (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              padding: '0.5rem 0',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}>
              {temoignagesImages.map(img => (
                <div
                  key={img.id}
                  style={{
                    width: '120px',
                    height: '210px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    flexShrink: 0,
                  }}
                >
                  <img src={img.url} alt="Testimonial screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (activeModule === 'faq') {
      const faqKeys = Array.from({ length: 8 }).map((_, i) => ({
        q: `q${i + 1}`,
        a: `a${i + 1}`
      }))

      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="badge" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', textAlign: 'left' })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqKeys.map((key, i) => (
              <div key={i} className="card" style={{ padding: '0.875rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'var(--card-backdrop)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.375rem' }}>
                  {renderEditableInput(key.q, { fontWeight: 600, color: 'var(--text-primary)' })}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {renderEditableInput(key.a, { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }, true, 2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    if (activeModule === 'affiliate_links') {
      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="badge" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' })}
            </span>
            <div style={{ marginBottom: '0.5rem' }}>
              {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', textAlign: 'center' })}
            </div>
            <div>
              {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '0.75rem 0',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  position: 'relative',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {`Sitio del socio ${i + 1}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {'Descripción del socio'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (activeModule === 'sports_marquee') {
      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--section-alt-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>
          <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ⚽ [Sports Channel Logo Slider Preview] ⚽
          </div>
        </div>
      )
    }

    if (activeModule === 'movies_marquee') {
      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>
          <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            🎬 [Blockbuster Movies Poster Slider Preview] 🎬
          </div>
        </div>
      )
    }

    if (activeModule === 'series_marquee') {
      return (
        <div style={{ padding: '2rem 1rem', background: 'var(--section-alt-bg)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            {renderEditableInput('title', { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', fontFamily: 'Outfit, sans-serif' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center' }, true, 2)}
          </div>
          <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            📺 [TV Series Poster Slider Preview] 📺
          </div>
        </div>
      )
    }

    if (activeModule === 'support_popup') {
      return (
        <div style={{ padding: '2.5rem 1.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>💬 客服悬浮弹窗预览 (实时模拟)</div>
          
          {/* Mock Floating Chat Widget Popup */}
          <div style={{
            width: '100%',
            maxWidth: '320px',
            background: 'var(--bg-secondary)',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
          }}>
            {/* Header */}
            <div style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--accent-gradient, linear-gradient(135deg, #10b981, #059669))',
              color: '#ffffff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  border: '2px solid var(--accent-1, #10b981)',
                  boxShadow: '0 0 8px #4ade80',
                }} />
              </div>

              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                  {renderEditableInput('agent_name', { fontWeight: 700, color: '#ffffff' })}
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {renderEditableInput('desc', { fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }, true, 3)}
              </div>

              {/* User message input box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <textarea
                  placeholder="Escribe tu mensaje aquí..."
                  disabled
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--input-bg, rgba(15, 23, 42, 0.6))',
                    border: '1px solid var(--input-border, rgba(148, 163, 184, 0.2))',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary, #f1f5f9)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--btn-primary-bg, #25d366)',
                color: 'var(--btn-primary-text, #ffffff)',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: 'var(--btn-primary-shadow, 0 4px 12px rgba(37, 211, 102, 0.25))',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.07 1.01 11.524 1.01c-5.443 0-9.866 4.372-9.87 9.802 0 1.714.475 3.393 1.374 4.869l-.928 3.39 3.488-.915zM17.41 15.6c-.3-.15-1.78-.88-2.06-.98-.28-.1-.49-.15-.69.15-.2.3-.78.98-.96 1.18-.18.2-.36.23-.66.08-1.54-.77-2.58-1.35-3.62-3.14-.28-.47.28-.44.79-1.46.09-.18.04-.33-.02-.48-.06-.15-.49-1.18-.67-1.62-.18-.43-.37-.37-.5-.37h-.43c-.15 0-.4.05-.61.28-.21.23-.81.8-1.02 1.95-.2 1.15.53 2.27.63 2.42.1.15 1.6 2.44 3.9 3.43.55.24 1 .38 1.33.49.56.18 1.07.15 1.48.09.45-.07 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.3-.21-.6-.36z" />
                </svg>
                <span>
                  {renderEditableInput('button_text', { fontWeight: 700, color: '#ffffff' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeModule === 'trial_cta') {
      return wrapPreviewWithBg(
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            {renderEditableInput('title', { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }, true)}
          </div>
          <div className="btn-primary" style={{ display: 'inline-flex', padding: '0.625rem 1.5rem', fontSize: '0.875rem', borderRadius: '0.5rem', fontWeight: 700 }}>
            {renderEditableInput('btn_text', { color: 'white', fontWeight: 700 })} →
          </div>
        </div>
      )
    }

    if (activeModule === 'plans_cta') {
      return wrapPreviewWithBg(
        <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="badge" style={{ display: 'inline-block' }}>
              {renderEditableInput('badge', { color: 'var(--accent-1)', fontSize: '0.75rem', fontWeight: 700 })}
            </span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            {renderEditableInput('title', { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            {renderEditableInput('subtitle', { fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }, true)}
          </div>
          <div className="btn-primary" style={{ display: 'inline-flex', padding: '0.625rem 1.5rem', fontSize: '0.875rem', borderRadius: '0.5rem', fontWeight: 700 }}>
            {renderEditableInput('btn_text', { color: 'white', fontWeight: 700 })} →
          </div>
        </div>
      )
    }

    if (activeModule === 'header') {
      const ctaVal = c.cta_text ? parseButtonValue(c.cta_text) : null
      return (
        <div style={{ padding: '2rem 1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '0.75rem', position: 'relative', minHeight: '150px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>
            🗂️ 页头导航预览
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0.5rem',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              IPTV Pro
            </span>

            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const key = `nav_link_${i + 1}`
                const val = c[key]
                if (!val) return null
                const buttonParsed = parseButtonValue(val)
                if (!buttonParsed.text) return null
                return (
                  <span key={key} style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {buttonParsed.text}
                  </span>
                )
              })}
            </div>

            {ctaVal && ctaVal.text && (
              <span className="btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.375rem' }}>
                {ctaVal.text}
              </span>
            )}
          </div>
        </div>
      )
    }

    if (activeModule === 'footer') {
      return (
        <div style={{ padding: '2rem 1rem', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>
            🗂️ 页尾版权与链接预览
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  IPTV Pro
                </div>
                {renderEditableInput('description', { fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }, true, 2)}
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  快速链接
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const key = `footer_link_${i + 1}`
                    const val = c[key]
                    if (!val) return null
                    const buttonParsed = parseButtonValue(val)
                    if (!buttonParsed.text) return null
                    return (
                      <span key={key} style={{ color: 'var(--text-secondary)' }}>
                        {buttonParsed.text}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {renderEditableInput('copyright', { color: 'var(--text-muted)', fontSize: '0.75rem' })}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/hero-bgs', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(await res.text() || '上传接口返回错误')
      }
      const data = await res.json()
      if (data.ok) {
        setBgImages(prev => [data.data, ...prev])
        await saveField('bg_image_url', data.data.url)
      } else {
        alert(data.error || '上传失败')
      }
    } catch (err: any) {
      console.error(err)
      alert('上传失败，请检查网络或重试')
    }
  }

  const handleDeleteBg = async (id: string, url: string) => {
    if (!confirm('确定删除这张背景图吗？')) return
    await fetch('/api/admin/hero-bgs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setBgImages(prev => prev.filter(img => img.id !== id))
    if (c.bg_image_url === url) {
      await saveField('bg_image_url', '')
    }
  }

  const handleUploadHowItWorksBg = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'background' | 'banner',
    fieldName: string
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch('/api/admin/how-it-works-bgs', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(await res.text() || '上传接口返回错误')
      }
      const data = await res.json()
      if (data.ok) {
        if (type === 'background') {
          setHowItWorksBgs(prev => [data.data, ...prev])
        } else {
          setHowItWorksBanners(prev => [data.data, ...prev])
        }
        await saveField(fieldName, data.data.url)
      } else {
        alert(data.error || '上传失败')
      }
    } catch (err: any) {
      console.error(err)
      alert('上传失败，请检查网络或重试')
    }
  }

  const handleDeleteHowItWorksBg = async (id: string, url: string, type: 'background' | 'banner') => {
    if (!confirm('确定删除这张图片吗？')) return
    await fetch('/api/admin/how-it-works-bgs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (type === 'background') {
      setHowItWorksBgs(prev => prev.filter(img => img.id !== id))
      if (c.bg_image_url === url) {
        await saveField('bg_image_url', '')
      }
    } else {
      setHowItWorksBanners(prev => prev.filter(img => img.id !== id))
      if (c.banner_image === url) {
        await saveField('banner_image', '')
      }
    }
  }

  const handleUploadPricingImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(await res.text() || '上传接口返回错误')
      }
      const data = await res.json()
      if (data.ok) {
        await saveField('pricing_image_url', data.url)
      } else {
        alert(data.error || '上传失败')
      }
    } catch (err: any) {
      console.error(err)
      alert('上传失败，请检查网络或重试')
    }
  }

  const handleUploadModuleBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('moduleId', activeModule)

    try {
      const res = await fetch('/api/admin/module-bgs', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(await res.text() || '上传接口返回错误')
      }
      const data = await res.json()
      if (data.ok) {
        setModuleBgs(prev => [data.data, ...prev])
        await saveField('bg_image_url', data.data.url)
      } else {
        alert(data.error || '上传失败')
      }
    } catch (err: any) {
      console.error(err)
      alert('上传失败，请检查网络 or 重试')
    }
  }

  const handleDeleteModuleBg = async (id: string, url: string) => {
    if (!confirm('确定删除这张背景图片吗？')) return
    await fetch('/api/admin/module-bgs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setModuleBgs(prev => prev.filter(img => img.id !== id))
    if (c.bg_image_url === url) {
      await saveField('bg_image_url', '')
    }
  }

  const handleUploadTemoignages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('locale', activeLocale)

    try {
      const res = await fetch('/api/admin/temoignages-images', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(await res.text() || '上传接口返回错误')
      }
      const data = await res.json()
      if (data.ok) {
        setTemoignagesImages(prev => [data.data, ...prev])
      } else {
        alert(data.error || '上传失败')
      }
    } catch (err: any) {
      console.error(err)
      alert('上传失败，请检查网络或重试')
    }
  }

  const handleDeleteTemoignages = async (id: string) => {
    if (!confirm('确定删除这张见证截图吗？')) return
    await fetch('/api/admin/temoignages-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setTemoignagesImages(prev => prev.filter(img => img.id !== id))
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Title & Visual Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>✏️ 内容编辑</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>修改每个模块的文字内容（三语言分别设置）</p>
        </div>
        <button
          onClick={() => setShowVisualEdit(!showVisualEdit)}
          style={{
            padding: '0.5rem 1.25rem',
            background: showVisualEdit ? 'linear-gradient(90deg,#22d3ee,#a855f7)' : 'rgba(30,41,59,0.8)',
            border: showVisualEdit ? 'none' : '1px solid rgba(148,163,184,0.2)',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}
        >
          {showVisualEdit ? '👁️ 关闭可视化编辑' : '🎨 开启可视化编辑'}
        </button>
      </div>

      {/* Locale tabs (PLACED ABOVE MODULE SELECTION) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['es', '🇪🇸 西班牙语']].map(([loc, label]) => (
          <button
            key={loc}
            onClick={() => changeLocale(loc as 'es')}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: '1px solid',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: activeLocale === loc ? '#22d3ee' : 'transparent',
              color: activeLocale === loc ? '#0f172a' : '#94a3b8',
              borderColor: activeLocale === loc ? '#22d3ee' : 'rgba(148,163,184,0.2)',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Module tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(moduleLabels).map(([id, label]) => (
          <button
            key={id}
            onClick={() => changeModule(id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: activeModule === id ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.8)',
              color: activeModule === id ? '#22d3ee' : '#94a3b8',
              borderColor: activeModule === id ? '#22d3ee' : 'transparent',
              borderWidth: 1,
              borderStyle: 'solid',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Grid: Form and Visual Preview side-by-side */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Column: Fields list */}
        <div style={{ flex: '1 1 350px', maxWidth: showVisualEdit ? '480px' : '700px' }}>
          {loading ? (
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>加载中...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeModule === 'hero' && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                    🖼️ Hero 背景图片设置
                  </h3>
                  
                  {/* Current selected preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: 80,
                      height: 50,
                      borderRadius: '0.375rem',
                      backgroundImage: c.bg_image_url ? `url(${c.bg_image_url})` : 'var(--hero-gradient)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                        {c.bg_image_url ? '已启用自定义背景' : '当前使用默认主题渐变背景'}
                      </div>
                      {c.bg_image_url && (
                        <button
                          onClick={() => saveField('bg_image_url', '')}
                          style={{
                            background: 'none', border: 'none', color: '#f87171',
                            fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem',
                            textDecoration: 'underline'
                          }}
                        >
                          恢复默认渐变
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload new */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(34, 211, 238, 0.1)',
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#22d3ee',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                    >
                      <span>📤 上传新背景图</span>
                      <input type="file" accept="image/*" onChange={handleUploadBg} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Gallery List */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem',
                  }}>
                    {/* First Card: Default Theme Gradient Background */}
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '1.6',
                        borderRadius: '0.375rem',
                        background: 'var(--hero-gradient)',
                        cursor: 'pointer',
                        border: !c.bg_image_url ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: !c.bg_image_url ? '0 0 10px rgba(34,211,238,0.3)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.25rem',
                      }}
                      onClick={() => saveField('bg_image_url', '')}
                      title="使用默认主题渐变背景"
                    >
                      <div style={{ fontSize: '0.6875rem', color: '#f1f5f9', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                        默认渐变
                      </div>
                      {!c.bg_image_url && (
                        <div style={{
                          position: 'absolute',
                          bottom: 2,
                          left: 2,
                          background: '#22d3ee',
                          color: '#0f172a',
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          padding: '0.05rem 0.2rem',
                          borderRadius: '0.2rem',
                          lineHeight: 1,
                        }}>
                          使用中
                        </div>
                      )}
                    </div>

                    {/* Uploaded Images */}
                    {bgImages.map(img => {
                      const isSelected = c.bg_image_url === img.url
                      return (
                        <div
                          key={img.id}
                          style={{
                            position: 'relative',
                            aspectRatio: '1.6',
                            borderRadius: '0.375rem',
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isSelected ? '0 0 10px rgba(34,211,238,0.3)' : 'none',
                          }}
                          onClick={() => saveField('bg_image_url', img.url)}
                        >
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              background: '#22d3ee',
                              color: '#0f172a',
                              fontSize: '0.55rem',
                              fontWeight: 800,
                              padding: '0.05rem 0.2rem',
                              borderRadius: '0.2rem',
                              lineHeight: 1,
                            }}>
                              使用中
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBg(img.id, img.url)
                            }}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(239, 68, 68, 0.85)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              width: 16,
                              height: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.625rem',
                              cursor: 'pointer',
                              zIndex: 10,
                            }}
                            title="删除图片"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeModule === 'hero' && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                    📐 Hero 布局方式设置
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { value: 'center', label: '居中布局' },
                      { value: 'left', label: '左上布局' }
                    ].map((mode) => {
                      const isSelected = (c.layout_mode || 'center') === mode.value
                      return (
                        <button
                          key={mode.value}
                          onClick={() => saveField('layout_mode', mode.value)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: isSelected ? '#22d3ee' : 'transparent',
                            color: isSelected ? '#0f172a' : '#94a3b8',
                            borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {mode.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeModule === 'hero' && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                    ⚙️ Hero 背景滤镜设置
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Show/Hide background image toggle */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片显示状态</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { value: 'true', label: '显示背景图片' },
                          { value: 'false', label: '不显示 (使用主题原背景)' }
                        ].map((opt) => {
                          const isSelected = (c.show_bg_image !== 'false' ? 'true' : 'false') === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => saveField('show_bg_image', opt.value)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                background: isSelected ? '#22d3ee' : 'transparent',
                                color: isSelected ? '#0f172a' : '#94a3b8',
                                borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                transition: 'all 0.2s',
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Sliders Container (Disabled when show_bg_image is false) */}
                    <div style={{
                      opacity: c.show_bg_image === 'false' ? 0.4 : 1,
                      pointerEvents: c.show_bg_image === 'false' ? 'none' : 'auto',
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem'
                    }}>
                      {/* Background scroll mode toggle */}
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片滚动模式</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[
                            { value: 'true', label: '固定背景 (视差效果)' },
                            { value: 'false', label: '跟随页面滚动' }
                          ].map((opt) => {
                            const isSelected = (c.bg_image_fixed !== 'false' ? 'true' : 'false') === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => saveField('bg_image_fixed', opt.value)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  background: isSelected ? '#22d3ee' : 'transparent',
                                  color: isSelected ? '#0f172a' : '#94a3b8',
                                  borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Blur slider */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>背景模糊度 (数值越大越模糊)</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                            {c.bg_blur ? `${c.bg_blur}px` : '0px (最清晰)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={c.bg_blur ? parseInt(c.bg_blur, 10) : 0}
                          onChange={(e) => updateLocalField('bg_blur', e.target.value)}
                          onMouseUp={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                          onTouchEnd={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                          style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                        />
                      </div>

                      {/* Darkness Overlay slider */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>背景遮罩强度 (百分比越高页面背景越黑)</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                            {c.bg_overlay_opacity ? `${Math.round(parseFloat(c.bg_overlay_opacity) * 100)}%` : '55% (默认)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.55}
                          onChange={(e) => updateLocalField('bg_overlay_opacity', e.target.value)}
                          onMouseUp={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                          onTouchEnd={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                          style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'how_it_works' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Box 1: Banner Image (Page content image) */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                      🖼️ Comment ça marche 页面横幅图片设置
                    </h3>

                    {/* Show/Hide Banner Toggle */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>是否显示体育横幅模块</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { value: 'true', label: '显示' },
                          { value: 'false', label: '隐藏' }
                        ].map((opt) => {
                          const isSelected = (c.show_banner !== 'false' ? 'true' : 'false') === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => saveField('show_banner', opt.value)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                background: isSelected ? '#22d3ee' : 'transparent',
                                color: isSelected ? '#0f172a' : '#94a3b8',
                                borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                transition: 'all 0.2s',
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: 80,
                        height: 50,
                        borderRadius: '0.375rem',
                        backgroundImage: c.banner_image ? `url(${c.banner_image})` : 'none',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                          {c.banner_image ? '已启用自定义页面图片' : '当前为默认页面图片'}
                        </div>
                        {c.banner_image && (
                          <button
                            onClick={() => saveField('banner_image', '')}
                            style={{
                              background: 'none', border: 'none', color: '#f87171',
                              fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem',
                              textDecoration: 'underline'
                            }}
                          >
                            恢复默认
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload new */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#22d3ee',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                      >
                        <span>📤 上传新图片</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadHowItWorksBg(e, 'banner', 'banner_image')} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Gallery List */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem',
                    }}>
                      {howItWorksBanners.map(img => {
                        const isSelected = c.banner_image === img.url
                        return (
                          <div
                            key={img.id}
                            style={{
                              position: 'relative',
                              aspectRatio: '1.6',
                              borderRadius: '0.375rem',
                              backgroundImage: `url(${img.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                              boxShadow: isSelected ? '0 0 10px rgba(34,211,238,0.3)' : 'none',
                            }}
                            onClick={() => saveField('banner_image', img.url)}
                          >
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                background: '#22d3ee',
                                color: '#0f172a',
                                fontSize: '0.55rem',
                                fontWeight: 800,
                                padding: '0.05rem 0.2rem',
                                borderRadius: '0.2rem',
                                lineHeight: 1,
                              }}>
                                使用中
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteHowItWorksBg(img.id, img.url, 'banner')
                              }}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.625rem',
                                cursor: 'pointer',
                                zIndex: 10,
                              }}
                              title="删除图片"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Box 2: Background Image */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                      🖼️ Comment ça marche 板块背景图片设置
                    </h3>
                    
                    {/* Current selected preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: 80,
                        height: 50,
                        borderRadius: '0.375rem',
                        backgroundImage: c.bg_image_url ? `url(${c.bg_image_url})` : 'none',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                          {c.bg_image_url ? '已启用自定义背景图片' : '当前为默认背景图片'}
                        </div>
                        {c.bg_image_url && (
                          <button
                            onClick={() => saveField('bg_image_url', '')}
                            style={{
                              background: 'none', border: 'none', color: '#f87171',
                              fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem',
                              textDecoration: 'underline'
                            }}
                          >
                            恢复默认
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload new */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#22d3ee',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                      >
                        <span>📤 上传新图片</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadHowItWorksBg(e, 'background', 'bg_image_url')} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Gallery List */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem',
                    }}>
                      {howItWorksBgs.map(img => {
                        const isSelected = c.bg_image_url === img.url
                        return (
                          <div
                            key={img.id}
                            style={{
                              position: 'relative',
                              aspectRatio: '1.6',
                              borderRadius: '0.375rem',
                              backgroundImage: `url(${img.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                              boxShadow: isSelected ? '0 0 10px rgba(34,211,238,0.3)' : 'none',
                            }}
                            onClick={() => saveField('bg_image_url', img.url)}
                          >
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                background: '#22d3ee',
                                color: '#0f172a',
                                fontSize: '0.55rem',
                                fontWeight: 800,
                                padding: '0.05rem 0.25rem',
                                borderRadius: '0.25rem',
                                lineHeight: 1,
                              }}>
                                使用中
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteHowItWorksBg(img.id, img.url, 'background')
                              }}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.625rem',
                                cursor: 'pointer',
                                zIndex: 10,
                              }}
                              title="删除图片"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Box 3: Background Clarity & Darkness Slider */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                      ⚙️ Comment ça marche 背景滤镜设置
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Show/Hide background image toggle */}
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片显示状态</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[
                            { value: 'true', label: '显示背景图片' },
                            { value: 'false', label: '不显示 (使用主题原背景)' }
                          ].map((opt) => {
                            const isSelected = (c.show_bg_image !== 'false' ? 'true' : 'false') === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => saveField('show_bg_image', opt.value)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  background: isSelected ? '#22d3ee' : 'transparent',
                                  color: isSelected ? '#0f172a' : '#94a3b8',
                                  borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Sliders Container (Disabled when show_bg_image is false) */}
                      <div style={{
                        opacity: c.show_bg_image === 'false' ? 0.4 : 1,
                        pointerEvents: c.show_bg_image === 'false' ? 'none' : 'auto',
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem'
                      }}>
                        {/* Background scroll mode toggle */}
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片滚动模式</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                              { value: 'true', label: '固定背景' },
                              { value: 'false', label: '跟随页面滚动' }
                            ].map((opt) => {
                              const isSelected = (c.bg_image_fixed !== 'false' ? 'true' : 'false') === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => saveField('bg_image_fixed', opt.value)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    background: isSelected ? '#22d3ee' : 'transparent',
                                    color: isSelected ? '#0f172a' : '#94a3b8',
                                    borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Blur slider */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>背景模糊度 (数值越大越模糊)</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                              {c.bg_blur ? `${c.bg_blur}px` : '0px (最清晰)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={c.bg_blur ? parseInt(c.bg_blur, 10) : 0}
                            onChange={(e) => updateLocalField('bg_blur', e.target.value)}
                            onMouseUp={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                            style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                          />
                        </div>

                        {/* Darkness Overlay slider */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>遮罩暗度 (百分比越高页面背景越黑)</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                              {c.bg_overlay_opacity ? `${Math.round(parseFloat(c.bg_overlay_opacity) * 100)}%` : '85% (默认)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.85}
                            onChange={(e) => updateLocalField('bg_overlay_opacity', e.target.value)}
                            onMouseUp={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                            style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'pricing' && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                    📊 定价显示模式设置
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { value: 'grid', label: '列表表格格式 (Grid)' },
                      { value: 'image', label: '单张图片格式 (Image)' }
                    ].map((mode) => {
                      const isSelected = (c.price_mode || 'grid') === mode.value
                      return (
                        <button
                          key={mode.value}
                          onClick={() => saveField('price_mode', mode.value)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: isSelected ? '#22d3ee' : 'transparent',
                            color: isSelected ? '#0f172a' : '#94a3b8',
                            borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {mode.label}
                        </button>
                      )
                    })}
                  </div>

                  {c.price_mode === 'image' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>价格表模块图片</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                          <div style={{
                            width: 80,
                            height: 50,
                            borderRadius: '0.375rem',
                            backgroundImage: c.pricing_image_url ? `url(${c.pricing_image_url})` : 'none',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }} />
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {c.pricing_image_url ? '已上传自定义价格表图片' : '当前未上传图片，使用默认提示'}
                            </span>
                          </div>
                        </div>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: 'rgba(34, 211, 238, 0.1)',
                          border: '1px solid rgba(34, 211, 238, 0.3)',
                          borderRadius: '0.5rem',
                          color: '#22d3ee',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                        >
                          <span>📤 上传价格表图片</span>
                          <input type="file" accept="image/*" onChange={handleUploadPricingImage} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!['hero', 'how_it_works', 'support_popup'].includes(activeModule) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.5rem' }}>
                  {/* Generic Background Image Settings Box */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                      🖼️ {moduleLabels[activeModule] || activeModule} 板块背景图片设置
                    </h3>
                    
                    {/* Current selected preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: 80,
                        height: 50,
                        borderRadius: '0.375rem',
                        backgroundImage: c.bg_image_url ? `url(${c.bg_image_url})` : 'none',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                          {c.bg_image_url ? '已启用自定义背景图片' : '当前使用默认背景/颜色'}
                        </div>
                        {c.bg_image_url && (
                          <button
                            onClick={() => saveField('bg_image_url', '')}
                            style={{
                              background: 'none', border: 'none', color: '#f87171',
                              fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem',
                              textDecoration: 'underline'
                            }}
                          >
                            恢复默认
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload new */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#22d3ee',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                      >
                        <span>📤 上传新图片</span>
                        <input type="file" accept="image/*" onChange={handleUploadModuleBg} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Gallery List */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem',
                    }}>
                      {moduleBgs.map(img => {
                        const isSelected = c.bg_image_url === img.url
                        return (
                          <div
                            key={img.id}
                            style={{
                              position: 'relative',
                              aspectRatio: '1.6',
                              borderRadius: '0.375rem',
                              backgroundImage: `url(${img.url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat',
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                              boxShadow: isSelected ? '0 0 10px rgba(34,211,238,0.3)' : 'none',
                            }}
                            onClick={() => saveField('bg_image_url', img.url)}
                          >
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                background: '#22d3ee',
                                color: '#0f172a',
                                fontSize: '0.55rem',
                                fontWeight: 800,
                                padding: '0.05rem 0.25rem',
                                borderRadius: '0.25rem',
                                lineHeight: 1,
                              }}>
                                使用中
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteModuleBg(img.id, img.url)
                              }}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(239, 68, 68, 0.85)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.625rem',
                                cursor: 'pointer',
                                zIndex: 10,
                              }}
                              title="删除图片"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Generic Background Filter Settings Box */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                      ⚙️ {moduleLabels[activeModule] || activeModule} 背景滤镜设置
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Show/Hide background image toggle */}
                      <div>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片显示状态</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[
                            { value: 'true', label: '显示背景图片' },
                            { value: 'false', label: '不显示 (使用主题原背景)' }
                          ].map((opt) => {
                            const isSelected = (c.show_bg_image !== 'false' ? 'true' : 'false') === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => saveField('show_bg_image', opt.value)}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  background: isSelected ? '#22d3ee' : 'transparent',
                                  color: isSelected ? '#0f172a' : '#94a3b8',
                                  borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Sliders Container (Disabled when show_bg_image is false) */}
                      <div style={{
                        opacity: c.show_bg_image === 'false' ? 0.4 : 1,
                        pointerEvents: c.show_bg_image === 'false' ? 'none' : 'auto',
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem'
                      }}>
                        {/* Background scroll mode toggle */}
                        <div>
                          <span style={{ display: 'block', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>背景图片滚动模式</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                              { value: 'true', label: '固定背景' },
                              { value: 'false', label: '跟随页面滚动' }
                            ].map((opt) => {
                              const isSelected = (c.bg_image_fixed !== 'false' ? 'true' : 'false') === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => saveField('bg_image_fixed', opt.value)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    background: isSelected ? '#22d3ee' : 'transparent',
                                    color: isSelected ? '#0f172a' : '#94a3b8',
                                    borderColor: isSelected ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Blur slider */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>背景模糊度 (数值越大越模糊)</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                              {c.bg_blur ? `${c.bg_blur}px` : '0px (最清晰)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={c.bg_blur ? parseInt(c.bg_blur, 10) : 0}
                            onChange={(e) => updateLocalField('bg_blur', e.target.value)}
                            onMouseUp={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => saveField('bg_blur', (e.target as HTMLInputElement).value)}
                            style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                          />
                        </div>

                        {/* Darkness Overlay slider */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>遮罩暗度 (百分比越高页面背景越黑)</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee' }}>
                              {c.bg_overlay_opacity ? `${Math.round(parseFloat(c.bg_overlay_opacity) * 100)}%` : '85% (默认)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={c.bg_overlay_opacity ? parseFloat(c.bg_overlay_opacity) : 0.85}
                            onChange={(e) => updateLocalField('bg_overlay_opacity', e.target.value)}
                            onMouseUp={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => saveField('bg_overlay_opacity', (e.target as HTMLInputElement).value)}
                            style={{ width: '100%', accentColor: '#22d3ee', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {['sports_marquee', 'movies_marquee', 'series_marquee'].includes(activeModule) && (() => {
                const type = activeModule.replace('_marquee', '')
                const emoji = type === 'sports' ? '⚽' : type === 'movies' ? '🎬' : '📺'
                const label = type === 'sports' ? '体育' : type === 'movies' ? '电影' : '剧集'
                const isSquare = type === 'sports'
                return (
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.5rem' }}>
                      {emoji} {label}滚动图片管理
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                      已上传 <strong style={{ color: '#f1f5f9' }}>{marqueeImages.length}</strong> 张。若无上传图片，前台将使用默认静态图片。
                    </p>

                    {/* Upload button */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
                        borderRadius: '0.5rem', color: '#22d3ee', fontSize: '0.8125rem',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.1)'}
                      >
                        <span>📤 上传图片（可多张）</span>
                        <input type="file" accept="image/*" multiple onChange={async (e) => {
                          const files = Array.from(e.target.files ?? [])
                          const imgType = activeModule.replace('_marquee', '')
                          let currentImages = marqueeImages
                          if (currentImages.length === 0) {
                            currentImages = await ensureMarqueeImagesImported(imgType)
                          }
                          for (const file of files) {
                            const fd = new FormData()
                            fd.append('file', file)
                            fd.append('type', imgType)
                            const res = await fetch('/api/admin/marquee-images', { method: 'POST', body: fd })
                            const json = await res.json()
                            if (json.ok) {
                              currentImages = [...currentImages, json.data]
                            }
                          }
                          setMarqueeImages(currentImages)
                          e.target.value = ''
                        }} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Image Grid */}
                    {(() => {
                      const defaultCount = type === 'sports' ? 14 : 30
                      const defaultImgs = Array.from({ length: defaultCount }, (_, i) => ({
                        id: `default-${i}`,
                        url: `/images/${type}/${i + 1}.webp`,
                        isDefault: true,
                      }))
                      const displayImages = marqueeImages.length > 0
                        ? marqueeImages.map(img => ({ ...img, isDefault: false }))
                        : defaultImgs

                      const usingDefault = marqueeImages.length === 0

                      return (
                        <>
                          {usingDefault && (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                              borderRadius: '0.5rem', padding: '0.375rem 0.75rem',
                              fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700,
                              marginBottom: '0.75rem',
                            }}>
                              ⚡ 当前使用默认静态图片（{defaultCount} 张）— 上传自定义图片或删除任一图片将自动导入并进行修改
                            </div>
                          )}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '0.4rem',
                            maxHeight: '380px',
                            overflowY: 'auto',
                            paddingRight: '0.25rem',
                          }}>
                            {displayImages.map(img => (
                              <div key={img.id} style={{
                                position: 'relative',
                                aspectRatio: isSquare ? '1' : '2/3',
                                borderRadius: '0.375rem',
                                backgroundImage: `url(${img.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: img.isDefault
                                  ? '1px solid rgba(245,158,11,0.3)'
                                  : '1px solid rgba(34,211,238,0.3)',
                                overflow: 'hidden',
                              }}>
                                {img.isDefault && (
                                  <div style={{
                                    position: 'absolute', bottom: 2, left: 2,
                                    background: 'rgba(245,158,11,0.85)', color: '#0f172a',
                                    fontSize: '0.5rem', fontWeight: 800,
                                    padding: '0.05rem 0.25rem', borderRadius: '0.2rem',
                                  }}>默认</div>
                                )}
                                <button
                                  onClick={() => handleDeleteMarqueeImage(img.id, img.url, img.isDefault)}
                                  style={{
                                    position: 'absolute', top: 2, right: 2,
                                    background: 'rgba(239,68,68,0.85)', color: 'white',
                                    border: 'none', borderRadius: '0.25rem',
                                    width: 16, height: 16, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.5rem', cursor: 'pointer', zIndex: 10,
                                  }}
                                  title="删除"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )
              })()}

              {activeModule === 'temoignages' && (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(30,41,59,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>
                    🖼️ TÉMOIGNAGES 见证截图设置
                  </h3>
                  
                  {/* Upload new */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(34, 211, 238, 0.1)',
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#22d3ee',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'}
                    >
                      <span>📤 上传新截图</span>
                      <input type="file" accept="image/*" onChange={handleUploadTemoignages} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Gallery List */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem',
                  }}>
                    {temoignagesImages.map(img => (
                      <div
                        key={img.id}
                        style={{
                          position: 'relative',
                          aspectRatio: '0.565',
                          borderRadius: '0.375rem',
                          backgroundImage: `url(${img.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemoignages(img.id)
                          }}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            cursor: 'pointer',
                            zIndex: 10,
                          }}
                          title="删除图片"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fields
                .filter(f => 
                  f.key !== 'brand_name' &&
                  f.key !== 'bg_image_url' && 
                  f.key !== 'show_bg_image' && 
                  f.key !== 'bg_blur' && 
                  f.key !== 'bg_overlay_opacity' && 
                  f.key !== 'bg_image_fixed' && 
                  f.key !== 'layout_mode' && 
                  f.key !== 'banner_image' && 
                  f.key !== 'show_banner' && 
                  f.key !== 'price_mode' && 
                  f.key !== 'pricing_image_url' && 
                  !f.key.endsWith('_icon') && 
                  !f.key.endsWith('_size') &&
                  !f.key.endsWith('_color') &&
                  !f.key.includes('_c')
                )
                .map((field) => {
                const isButton = field.key === 'cta_primary' || field.key === 'cta_secondary' || field.key === 'btn_text' || field.key === 'button_text' || field.key === 'cta_text' || field.key.startsWith('nav_link_') || field.key.startsWith('footer_link_')
                const parsed = parseJsonValue(field.value)
                const buttonParsed = isButton ? parseButtonValue(field.value) : null
                const isLong = !isButton && (parsed.text.length > 80 || field.key.includes('desc') || field.key.includes('subtitle') || field.key.includes('_text') || field.key.includes('_a'))
                return (
                  <div key={field.key} style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(30,41,59,0.5)',
                    border: '1px solid rgba(148,163,184,0.08)',
                    borderRadius: '0.625rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#22d3ee', fontFamily: 'sans-serif' }}>
                        {getFieldLabel(activeModule, field.key)}
                        <span style={{ color: '#475569', fontSize: '0.75rem', marginLeft: '0.5rem', fontFamily: 'monospace' }}>({field.key})</span>
                      </label>
                      {saved === field.key && (
                        <span style={{ fontSize: '0.75rem', color: '#22d3ee' }}>✅ 已保存</span>
                      )}
                      {saving === field.key && (
                        <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>保存中...</span>
                      )}
                    </div>
                    {isButton && buttonParsed ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Button text input */}
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>按钮显示文字</span>
                          <input
                            type="text"
                            value={buttonParsed.text}
                            style={inputStyle}
                            onChange={(e) => onButtonPropChange(field.key, 'text', e.target.value)}
                            onBlur={(e) => saveButtonPropChange(field.key, 'text', e.target.value)}
                          />
                        </div>
                        
                        {/* Action selector */}
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.375rem' }}>点击按钮行为设置</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem', marginBottom: '0.5rem' }}>
                            {[
                              { value: 'whatsapp', label: '💬 WhatsApp跳转' },
                              { value: 'anchor', label: '⚓ 跳转到模块锚点' },
                              { value: 'page', label: '📄 打开系统页面' },
                              { value: 'url', label: '🔗 外部自定义链接' }
                            ].map((opt) => {
                              const isSelected = buttonParsed.actionType === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => saveButtonPropChange(field.key, 'actionType', opt.value)}
                                  style={{
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    border: isSelected ? '1px solid #22d3ee' : '1px solid rgba(148,163,184,0.15)',
                                    background: isSelected ? 'rgba(34,211,238,0.15)' : 'transparent',
                                    color: isSelected ? '#22d3ee' : '#94a3b8',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Conditional targets */}
                        {buttonParsed.actionType === 'anchor' && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>选择目标锚点模块</span>
                            <select
                              value={buttonParsed.actionTarget}
                              onChange={(e) => saveButtonPropChange(field.key, 'actionTarget', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'rgba(15,23,42,0.8)',
                                border: '1px solid rgba(148,163,184,0.2)',
                                borderRadius: '0.5rem',
                                color: '#f1f5f9',
                                fontSize: '0.85rem',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="" disabled style={{ background: '#0f172a' }}>请选择目标模块</option>
                              {systemModules.map((m) => (
                                <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>
                                  {moduleLabels[m.id] || m.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {buttonParsed.actionType === 'page' && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>选择系统页面</span>
                            <select
                              value={buttonParsed.actionTarget}
                              onChange={(e) => saveButtonPropChange(field.key, 'actionTarget', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'rgba(15,23,42,0.8)',
                                border: '1px solid rgba(148,163,184,0.2)',
                                borderRadius: '0.5rem',
                                color: '#f1f5f9',
                                fontSize: '0.85rem',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="" disabled style={{ background: '#0f172a' }}>请选择系统页面</option>
                              {subpages.filter(p => p.locale === activeLocale).map((p) => (
                                <option key={p.id} value={p.slug} style={{ background: '#0f172a' }}>
                                  {p.title} ({p.slug})
                                </option>
                              ))}
                              {subpages.filter(p => p.locale === activeLocale).length === 0 && (
                                <option value="" disabled style={{ background: '#0f172a' }}>
                                  暂无该语言下的系统页面
                                </option>
                              )}
                            </select>
                          </div>
                        )}

                        {buttonParsed.actionType === 'url' && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>输入自定义网址 URL</span>
                            <input
                              type="text"
                              value={buttonParsed.actionTarget}
                              placeholder="https://example.com"
                              style={inputStyle}
                              onChange={(e) => onButtonPropChange(field.key, 'actionTarget', e.target.value)}
                              onBlur={(e) => saveButtonPropChange(field.key, 'actionTarget', e.target.value)}
                            />
                          </div>
                        )}

                        {buttonParsed.actionType === 'whatsapp' && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>WhatsApp 预设消息 (不填则使用系统默认)</span>
                            <input
                              type="text"
                              value={buttonParsed.whatsappMsg || ''}
                              placeholder="例如：你好，我想了解 1 个月订阅计划..."
                              style={inputStyle}
                              onChange={(e) => onButtonPropChange(field.key, 'whatsappMsg', e.target.value)}
                              onBlur={(e) => saveButtonPropChange(field.key, 'whatsappMsg', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ) : isLong ? (
                      <textarea
                        key={`${field.moduleId}-${field.locale}-${field.key}`}
                        value={parsed.text}
                        rows={3}
                        style={inputStyle}
                        onChange={(e) => {
                          const oldParsed = parseJsonValue(field.value)
                          const newValue = (oldParsed.href || oldParsed.font || oldParsed.gradient)
                            ? JSON.stringify({ text: e.target.value, href: oldParsed.href, font: oldParsed.font, gradient: oldParsed.gradient })
                            : e.target.value
                          updateLocalField(field.key, newValue)
                        }}
                        onBlur={(e) => {
                          const oldParsed = parseJsonValue(field.value)
                          const newValue = (oldParsed.href || oldParsed.font || oldParsed.gradient)
                            ? JSON.stringify({ text: e.target.value, href: oldParsed.href, font: oldParsed.font, gradient: oldParsed.gradient })
                            : e.target.value
                          saveField(field.key, newValue)
                        }}
                      />
                    ) : (
                      <input
                        key={`${field.moduleId}-${field.locale}-${field.key}`}
                        type="text"
                        value={parsed.text}
                        style={inputStyle}
                        onChange={(e) => {
                          const oldParsed = parseJsonValue(field.value)
                          const newValue = (oldParsed.href || oldParsed.font || oldParsed.gradient)
                            ? JSON.stringify({ text: e.target.value, href: oldParsed.href, font: oldParsed.font, gradient: oldParsed.gradient })
                            : e.target.value
                          updateLocalField(field.key, newValue)
                        }}
                        onBlur={(e) => {
                          const oldParsed = parseJsonValue(field.value)
                          const newValue = (oldParsed.href || oldParsed.font || oldParsed.gradient)
                            ? JSON.stringify({ text: e.target.value, href: oldParsed.href, font: oldParsed.font, gradient: oldParsed.gradient })
                            : e.target.value
                           saveField(field.key, newValue)
                        }}
                      />
                    )}
                  </div>
                )
              })}
              {fields.length === 0 && (
                <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '2rem', textAlign: 'center' }}>
                  该模块暂无内容数据
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Visual Preview Panel */}
        {showVisualEdit && !loading && fields.length > 0 && (
          <div style={{
            flex: '1 1 450px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: 'var(--card-shadow)',
            minHeight: '400px',
            position: 'sticky',
            top: '2rem',
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 6rem)',
            overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🖥️ 实时可视化预览（悬停高亮，点击可直接修改并同步保存）
            </h3>
            {renderVisualPreview()}
          </div>
        )}
      </div>
    </div>
  )
}
