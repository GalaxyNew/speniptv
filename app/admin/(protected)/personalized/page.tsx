'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'


interface PersonalizedSettings {
  id: string
  locale: string
  activeTheme: string
  activeFont: string
  brandName: string
  brandLogoUrl: string
  whatsappNumber: string
  whatsappMsg: string
  telegramUrl: string
  contactEmail: string
  supportPopupDelay: number | null
  showSupportWidget: boolean
  googleSiteVerification: string
  bingSiteVerification: string
  [key: string]: any
}

const themes = [
  { value: '', label: '⚙️ 使用全局系统设置默认主题', desc: '不单独设置此国家的主题' },
  { value: 'dark-tech', label: '🌌 暗黑科技风', desc: '深蓝背景 · 霓虹青/紫' },
  { value: 'elegant-light', label: '☀️ 淡雅清新风', desc: '浅色背景 · 天蓝/绿' },
  { value: 'corporate-blue', label: '🏢 专业公司蓝', desc: '白色背景 · 企业蓝' },
  { value: 'violet-glow', label: '🔮 极光霓虹紫 (极光风格)', desc: '暗紫背景 · 霓虹粉/紫' },
  { value: 'channelmoa', label: '🔴 科技烈焰红 (ChannelMoa 官方风格)', desc: '深灰背景 · 烈焰红/橙' },
]

const fonts = [
  { value: '', label: '⚙️ 使用全局系统设置默认字体' },
  { value: 'Outfit', label: 'Outfit (几何现代)' },
  { value: 'Inter', label: 'Inter (科技干净)' },
  { value: 'Poppins', label: 'Poppins (饱满亲和)' },
  { value: 'Montserrat', label: 'Montserrat (优雅经典)' },
  { value: 'Roboto', label: 'Roboto (标准中性)' },
  { value: 'Playfair Display', label: 'Playfair Display (奢华衬线)' },
  { value: 'Lora', label: 'Lora (文雅衬线)' },
]

export default function PersonalizedPage() {
  const { showPermissionAlert } = usePermission()
  const [activeLocale, setActiveLocale] = useState<'es'>('es')
  const [settings, setSettings] = useState<Partial<PersonalizedSettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch settings when activeLocale changes
  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/personalized?locale=${activeLocale}`)
      .then(r => r.json())
      .then(data => {
        setSettings(data ?? {})
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [activeLocale])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/personalized', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: activeLocale, ...settings }),
      })
      if (res.status === 403) {
        showPermissionAlert()
      } else if (!res.ok) {
        alert('保存失败，请重试')
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error(err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof PersonalizedSettings, label: string, type = 'text', placeholder = '留空则使用全局系统设置默认值') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
        {label}
      </label>
      <input
        type={type}
        value={settings[key] ?? ''}
        onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: '0.5rem',
          color: '#f1f5f9',
          fontSize: '0.9rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>加载中...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 700 }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>🎨 个性设置 (按国家/语言)</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>设置不同国家或语言的独立主题、品牌名称、客服联系方式、SEO 搜索引擎验证码</p>
        </div>
        <button onClick={save} disabled={saving} style={{
          padding: '0.625rem 1.5rem',
          background: saved ? '#10b981' : 'linear-gradient(90deg,#22d3ee,#a855f7)',
          border: 'none',
          borderRadius: '0.5rem',
          color: 'white',
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          flexShrink: 0,
        }}>
          {saved ? '✅ 已保存' : saving ? '保存中...' : '💾 保存'}
        </button>
      </div>

      {/* Locale tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {(['es'] as const).map(l => (
          <button key={l} onClick={() => setActiveLocale(l)} style={{
            padding: '0.375rem 1rem', borderRadius: '0.375rem',
            border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
            background: activeLocale === l ? '#22d3ee' : 'transparent',
            color: activeLocale === l ? '#0f172a' : '#94a3b8',
            borderColor: activeLocale === l ? '#22d3ee' : 'rgba(148,163,184,0.2)',
          }}>
            {l === 'es' ? '🇪🇸 西语 (es)' : l}
          </button>
        ))}
      </div>

      {/* Theme selection override */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🎨 主题重写 ({activeLocale.toUpperCase()})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {themes.map(t => (
            <label key={t.value} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: (settings.activeTheme ?? '') === t.value ? 'rgba(34,211,238,0.08)' : 'rgba(15,23,42,0.5)',
              border: `1px solid ${(settings.activeTheme ?? '') === t.value ? 'rgba(34,211,238,0.3)' : 'rgba(148,163,184,0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <input type="radio" name="theme" value={t.value} checked={(settings.activeTheme ?? '') === t.value}
                onChange={() => setSettings(prev => ({ ...prev, activeTheme: t.value }))}
                style={{ accentColor: '#22d3ee' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{t.label}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Font selection override */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🔤 字体重写 ({activeLocale.toUpperCase()})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {fonts.map(f => (
            <label key={f.value} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: (settings.activeFont ?? '') === f.value ? 'rgba(34,211,238,0.08)' : 'rgba(15,23,42,0.5)',
              border: `1px solid ${(settings.activeFont ?? '') === f.value ? 'rgba(34,211,238,0.3)' : 'rgba(148,163,184,0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <input type="radio" name="font" value={f.value} checked={(settings.activeFont ?? '') === f.value}
                onChange={() => setSettings(prev => ({ ...prev, activeFont: f.value }))}
                style={{ accentColor: '#22d3ee' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
                  {f.label}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Brand overrides */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🏷️ 品牌重写 ({activeLocale.toUpperCase()})</h2>
        {field('brandName', '此语言的品牌名称')}
        {field('brandLogoUrl', '此语言的 Logo 图片 URL')}
      </section>

      {/* WhatsApp override */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>💬 WhatsApp 重写 ({activeLocale.toUpperCase()})</h2>
        {field('whatsappNumber', '此语言专属 WhatsApp 号码 (电话号码前请保留+号与区号)')}
        {field('whatsappMsg', '此语言专属预设消息')}
      </section>

      {/* Support Popup delay override */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>💬 客服弹窗重写 ({activeLocale.toUpperCase()})</h2>
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="checkbox"
            id="showSupportWidget"
            checked={settings.showSupportWidget !== false}
            onChange={e => setSettings(prev => ({ ...prev, showSupportWidget: e.target.checked }))}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22d3ee' }}
          />
          <label htmlFor="showSupportWidget" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', cursor: 'pointer' }}>
            启用客服模块 (控制在此语言的前端页面上是否显示客服图标与弹窗)
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
            客服弹窗弹出延迟时间 (秒)
          </label>
          <input
            type="text"
            placeholder="留空则使用全局系统设置延迟"
            value={settings.supportPopupDelay !== null && settings.supportPopupDelay !== undefined ? settings.supportPopupDelay : ''}
            onChange={e => {
              const val = e.target.value
              setSettings(prev => ({ ...prev, supportPopupDelay: val === '' ? null : parseInt(val) || 0 }))
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </section>

      {/* Contact overrides */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>📞 联系方式重写 ({activeLocale.toUpperCase()})</h2>
        {field('telegramUrl', '此语言的 Telegram 链接')}
        {field('contactEmail', '此语言的联系邮箱')}
      </section>

      {/* Search engine verification overrides */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🔍 搜索引擎验证码重写 ({activeLocale.toUpperCase()})</h2>
        {field('googleSiteVerification', '此语言的 Google Search Console 验证码')}
        {field('bingSiteVerification', '此语言的 Bing Webmaster 验证码')}
      </section>
    </div>
  )
}
