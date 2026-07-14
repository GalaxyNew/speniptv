'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

interface Module {
  id: string
  isVisible: boolean
  isVisible_fr: boolean
  isVisible_es: boolean
  isVisible_en: boolean
  isVisible_zh: boolean
  sortOrder: number
  sortOrder_fr: number
  sortOrder_es: number
  sortOrder_en: number
  sortOrder_zh: number
}

const moduleNames: Record<string, string> = {
  hero: '🦸 Hero 主区域',
  authority: '📊 权威数据',
  pricing: '💰 定价套餐',
  features: '⚡ 功能特性',
  content: '🎬 Content 类别展示',
  sports_marquee: '⚽ Sports 体育滚动',
  movies_marquee: '🎬 Movies 电影滚动',
  series_marquee: '📺 Series 剧集滚动',
  devices: '📱 设备兼容',
  testimonials: '⭐ 用户评价',
  faq: '❓ 常见问题',
  trial_cta: '💬 立即试用 (Trial CTA)',
  plans_cta: '📉 查看价格 (Plans CTA)',
  temoignages: '💬 用户评价[版本二]',
  affiliate_links: '🔗 外链列表',
  nos_services: '🛠️ 我们的服务',
  how_it_works: 'ℹ️ 如何购买',
}

const localeLabels = { fr: '🇫🇷 法语', es: '🇪🇸 西班牙语', en: '🇬🇧 英语', zh: '🇨🇳 中文' }

export default function ModulesPage() {
  const { showPermissionAlert } = usePermission()
  const [modules, setModules] = useState<Module[]>([])
  const [activeLocale, setActiveLocale] = useState<'es'>('es')
  const [saving, setSaving] = useState<string | null>(null)

  const getSortOrderForLocale = (mod: Module, loc: string) => {
    if (loc === 'fr') return mod.sortOrder_fr ?? 0
    if (loc === 'es') return mod.sortOrder_es ?? 0
    if (loc === 'en') return mod.sortOrder_en ?? 0
    if (loc === 'zh') return mod.sortOrder_zh ?? 0
    return mod.sortOrder ?? 0
  }

  const loadModules = (loc: string = activeLocale) => {
    fetch('/api/admin/modules?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then((data: Module[]) => {
        const sorted = [...data].sort((a, b) => getSortOrderForLocale(a, loc) - getSortOrderForLocale(b, loc))
        setModules(sorted)
      })
  }

  // Load modules whenever active locale changes
  useEffect(() => {
    loadModules(activeLocale)
  }, [activeLocale])

  const getVisibilityForLocale = (mod: Module, loc: string) => {
    if (loc === 'fr') return mod.isVisible_fr
    if (loc === 'es') return mod.isVisible_es
    if (loc === 'en') return mod.isVisible_en
    if (loc === 'zh') return mod.isVisible_zh
    return mod.isVisible
  }

  const toggle = async (id: string, isVisible: boolean) => {
    setSaving(id)
    setModules(prev => prev.map(m => {
      if (m.id !== id) return m
      return { ...m, isVisible_es: isVisible }
    }))

    try {
      const res = await fetch('/api/admin/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, locale: activeLocale, isVisible }),
      })
      if (res.status === 403) {
        showPermissionAlert()
        loadModules(activeLocale)
      } else if (!res.ok) {
        alert('操作失败，请重试')
        loadModules(activeLocale)
      }
    } catch (e) {
      alert('操作失败，请重试')
      loadModules(activeLocale)
    } finally {
      setSaving(null)
    }
  }

  const moveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index === 0 || targetIndex === 0 || index >= modules.length || targetIndex >= modules.length) {
      return
    }

    // Move module in array
    const newModules = [...modules]
    const [movedModule] = newModules.splice(index, 1)
    newModules.splice(targetIndex, 0, movedModule)

    // Re-assign sequential orders (1-based index)
    const updatedModules = newModules.map((m, idx) => {
      const newOrder = idx + 1
      return { ...m, sortOrder_es: newOrder }
    })

    setModules(updatedModules)

    // Send updates for any changed sort orders
    const promises = updatedModules.map((m) => {
      const originalMod = modules.find(x => x.id === m.id)
      const oldOrder = originalMod ? getSortOrderForLocale(originalMod, activeLocale) : -1
      const newOrder = getSortOrderForLocale(m, activeLocale)

      if (oldOrder !== newOrder) {
        return fetch('/api/admin/modules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: m.id, locale: activeLocale, sortOrder: newOrder }),
        })
      }
      return null
    }).filter(Boolean) as Promise<Response>[]

    if (promises.length > 0) {
      try {
        const results = await Promise.all(promises)
        if (results.some(r => r.status === 403)) {
          showPermissionAlert()
        } else if (results.some(r => !r.ok)) {
          alert('操作失败，请重试')
        }
      } catch (e) {
        alert('操作失败，请重试')
      }
    }
    loadModules(activeLocale)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f1f5f9' }}>📦 模块管理</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        控制前台各区块的显示/隐藏与顺序（按国家/语言分别设置，Hero模块固定置顶）。隐藏的模块不会输出 any HTML，对 SEO 无影响。
      </p>

      {/* Locale switcher tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[['es', '🇪🇸 西班牙语']].map(([loc, label]) => (
          <button
            key={loc}
            onClick={() => setActiveLocale(loc as 'es')}
            style={{
              padding: '0.375rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8125rem',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 600 }}>
        {modules.map((mod, i) => {
          const isVisible = getVisibilityForLocale(mod, activeLocale)
          const isHero = mod.id === 'hero'

          return (
            <div key={mod.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: 'rgba(30,41,59,0.6)',
              border: `1px solid ${isVisible ? 'rgba(34,211,238,0.2)' : 'rgba(148,163,184,0.08)'}`,
              borderRadius: '0.625rem',
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Drag / Sort Arrows Column */}
                {!isHero ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '0.25rem' }}>
                    <button
                      onClick={() => moveModule(i, 'up')}
                      disabled={i <= 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: i <= 1 ? '#475569' : '#22d3ee',
                        cursor: i <= 1 ? 'not-allowed' : 'pointer',
                        padding: '2px 4px',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        transition: 'color 0.2s',
                      }}
                      title="上移"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveModule(i, 'down')}
                      disabled={i === modules.length - 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: i === modules.length - 1 ? '#475569' : '#22d3ee',
                        cursor: i === modules.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '2px 4px',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        transition: 'color 0.2s',
                      }}
                      title="下移"
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '22px', display: 'flex', justifyContent: 'center', marginRight: '0.25rem' }} title="固定置顶">
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>📌</span>
                  </div>
                )}

                <span style={{ fontSize: '1rem', color: isVisible ? '#22d3ee' : '#64748b' }}>
                  {isVisible ? '👁️' : '🚫'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: isVisible ? '#f1f5f9' : '#64748b', fontSize: '0.9rem' }}>
                    {moduleNames[mod.id] ?? mod.id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.125rem' }}>
                    ID: {mod.id} · 顺序: {getSortOrderForLocale(mod, activeLocale)}
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggle(mod.id, !isVisible)}
                disabled={saving === mod.id}
                style={{
                  position: 'relative',
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: isVisible ? '#22d3ee' : 'rgba(148,163,184,0.2)',
                  border: 'none',
                  cursor: saving === mod.id ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: isVisible ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.3s',
                  display: 'block',
                }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
