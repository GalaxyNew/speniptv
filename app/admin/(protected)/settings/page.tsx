'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

interface Settings {
  defaultLocale: string
  footerCopyright: string
  [key: string]: any
}

const locales = [
  { value: 'es', label: '🇪🇸 西班牙语 (es)' },
]

export default function SettingsPage() {
  const { showPermissionAlert } = usePermission()
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [localeMode, setLocaleMode] = useState<'detect' | 'force'>('force')
  const [forcedLocale, setForcedLocale] = useState<string>('es')

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setSettings(data ?? {})
      if (data) {
        if (data.defaultLocale === 'auto') {
          setLocaleMode('detect')
          setForcedLocale('es')
        } else {
          setLocaleMode('force')
          setForcedLocale(data.defaultLocale || 'es')
        }
      }
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
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

  const field = (key: keyof Settings, label: string, type = 'text', placeholder = '') => (
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

  const textareaField = (key: keyof Settings, label: string, rows = 6, placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
        {label}
      </label>
      <textarea
        rows={rows}
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
          resize: 'vertical',
          fontFamily: 'monospace',
        }}
      />
    </div>
  )

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>加载中...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>⚙️ 系统设置 (全局)</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>管理系统默认语言和全局页脚版权信息</p>
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
        }}>
          {saved ? '✅ 已保存' : saving ? '保存中...' : '💾 保存'}
        </button>
      </div>

      {/* System */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>🌍 系统语言与版权</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>
            默认语言设置
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Option 1: Detect */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: localeMode === 'detect' ? 'rgba(34,211,238,0.08)' : 'rgba(15,23,42,0.5)',
              border: `1px solid ${localeMode === 'detect' ? 'rgba(34,211,238,0.3)' : 'rgba(148,163,184,0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <input type="radio" name="localeMode" value="detect" checked={localeMode === 'detect'}
                onChange={() => {
                  setLocaleMode('detect')
                  setSettings(prev => ({ ...prev, defaultLocale: 'auto' }))
                }}
                style={{ accentColor: '#22d3ee' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>🌐 自动检测 (跟随访问者国家地区)</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem' }}>优先根据访客IP所属国家分配语言，无IP信息时解析浏览器语言</div>
              </div>
            </label>

            {/* Option 2: Force */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: localeMode === 'force' ? 'rgba(34,211,238,0.08)' : 'rgba(15,23,42,0.5)',
              border: `1px solid ${localeMode === 'force' ? 'rgba(34,211,238,0.3)' : 'rgba(148,163,184,0.1)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <input type="radio" name="localeMode" value="force" checked={localeMode === 'force'}
                onChange={() => {
                  setLocaleMode('force')
                  setSettings(prev => ({ ...prev, defaultLocale: forcedLocale }))
                }}
                style={{ accentColor: '#22d3ee' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>🔒 强制指定默认语言</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.125rem' }}>无论访客来自哪里，一律默认显示选定的语言</div>
              </div>
            </label>
          </div>

          {/* Conditional Dropdown for Force Mode */}
          {localeMode === 'force' && (
            <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
              <select
                value={forcedLocale}
                onChange={e => {
                  const val = e.target.value
                  setForcedLocale(val)
                  setSettings(prev => ({ ...prev, defaultLocale: val }))
                }}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '0.5rem',
                  color: '#f1f5f9',
                  fontSize: '0.9rem',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '300px',
                }}
              >
                {locales.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {field('footerCopyright', '页脚版权文字（{year} 和 {brand} 会自动替换）', 'text', '© {year} {brand}. All rights reserved.')}
      </section>

      {/* Global Contact Details */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>📞 全局联系方式</h2>
        {field('whatsappNumber', '全局默认 WhatsApp 号码 (例如: +33612345678)')}
        {field('telegramUrl', '全局默认 Telegram 链接 (例如: https://t.me/yourusername)')}
        {field('contactEmail', '全局默认联系邮箱')}
      </section>

      {/* Code Injection */}
      <section style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem' }}>💻 HTML 代码注入 (全局)</h2>
        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
          用于在所有多语言页面中注入自定义 HTML 脚本。例如 Google Analytics (GA4) 跟踪代码、客服系统的 JS 脚本等。
        </p>
        {textareaField('analyticsHead', '页头代码注入 (注入至 <head> 中)', 5, '<!-- 例如: <script>...</script> -->')}
        {textareaField('analyticsBody', '页底代码注入 (注入至 <body> 尾部)', 5, '<!-- 例如: <script>...</script> -->')}
      </section>
    </div>
  )
}
