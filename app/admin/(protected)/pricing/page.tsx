'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'


interface PlanLabel {
  id: string
  locale: string
  duration: string
  ctaText: string
  subText?: string
  features: string
  waMessage: string
  price: number
  originalPrice: number | null
  isRecommended: boolean
  currencySymbol: string
}

interface Plan {
  id: string
  sortOrder: number
  labels: PlanLabel[]
}

interface Tier {
  id: string
  sortOrder: number
  labels: { id: string; locale: string; name: string }[]
  plans: Plan[]
}

export default function PricingPage() {
  const { showPermissionAlert } = usePermission()
  const [tiers, setTiers] = useState<Tier[]>([])
  const [settings, setSettings] = useState({ display_devices: '1,2,3', display_months: '1,3,6,12' })
  const [activeLocale, setActiveLocale] = useState<'es'>('es')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pricing')
      .then(r => r.json())
      .then(data => {
        setTiers(data.tiers)
        if (data.settings) {
          setSettings(data.settings)
        }
        setLoading(false)
      })
  }, [])

  const savePlanLabel = async (labelId: string, field: string, value: any) => {
    setSaving(labelId + field)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planLabelId: labelId, field, value }),
      })
      if (res.status === 403) {
        showPermissionAlert()
      } else if (!res.ok) {
        alert('保存失败，请重试')
      } else {
        setSaved(labelId + field)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch (err) {
      console.error(err)
      alert('保存失败，请重试')
    } finally {
      setSaving(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '0.375rem',
    color: '#f1f5f9',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>加载中...</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f1f5f9' }}>💰 定价管理</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        管理套餐价格、货币符号、推荐套餐、文案和 WhatsApp 预设消息
      </p>

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
            {l === 'es' ? '🇪🇸 西语' : l}
          </button>
        ))}
      </div>

      {/* Pricing Settings Controls */}
      <div style={{
        background: 'rgba(30,41,59,0.5)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        {/* Device selection checkboxes */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>显示设备数设置 (多选)</h3>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[1, 2, 3].map(dev => {
              const enabled = settings.display_devices.split(',').includes(String(dev))
              return (
                <label key={dev} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#f1f5f9' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={async (e) => {
                      let devices = settings.display_devices.split(',').filter(Boolean)
                      if (e.target.checked) {
                        if (!devices.includes(String(dev))) devices.push(String(dev))
                      } else {
                        devices = devices.filter(d => d !== String(dev))
                      }
                      // Must select at least one
                      if (devices.length === 0) devices = [String(dev)]
                      const newVal = devices.sort().join(',')
                      setSettings(s => ({ ...s, display_devices: newVal }))
                      const res = await fetch('/api/admin/pricing', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ settingKey: 'display_devices', value: newVal })
                      })
                      if (res.status === 403) {
                        showPermissionAlert()
                        setSettings(s => ({ ...s, display_devices: settings.display_devices }))
                      } else if (!res.ok) {
                        alert('保存失败，请重试')
                        setSettings(s => ({ ...s, display_devices: settings.display_devices }))
                      }
                    }}
                  />
                  {dev} 台设备
                </label>
              )
            })}
          </div>
        </div>

        {/* Month selection checkboxes */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.75rem' }}>显示月份设置 (多选)</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[1, 3, 6, 12].map(mon => {
              const enabled = settings.display_months.split(',').includes(String(mon))
              return (
                <label key={mon} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#f1f5f9' }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={async (e) => {
                      let months = settings.display_months.split(',').filter(Boolean)
                      if (e.target.checked) {
                        if (!months.includes(String(mon))) months.push(String(mon))
                      } else {
                        months = months.filter(m => m !== String(mon))
                      }
                      // Must select at least one
                      if (months.length === 0) months = [String(mon)]
                      const newVal = months.map(Number).sort((a,b) => a-b).join(',')
                      setSettings(s => ({ ...s, display_months: newVal }))
                      const res = await fetch('/api/admin/pricing', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ settingKey: 'display_months', value: newVal })
                      })
                      if (res.status === 403) {
                        showPermissionAlert()
                        setSettings(s => ({ ...s, display_months: settings.display_months }))
                      } else if (!res.ok) {
                        alert('保存失败，请重试')
                        setSettings(s => ({ ...s, display_months: settings.display_months }))
                      }
                    }}
                  />
                  {mon} 个月
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {tiers.map(tier => (
        <div key={tier.id} style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#22d3ee', marginBottom: '1rem' }}>
            {tier.labels.find(l => l.locale === activeLocale)?.name ?? tier.id}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {tier.plans.map(plan => {
              const label = plan.labels.find(l => l.locale === activeLocale)
              if (!label) return null

              let features: string[] = []
              try { features = JSON.parse(label.features) } catch {}

              return (
                <div key={`${plan.id}-${activeLocale}`} style={{
                  padding: '1.25rem',
                  background: label.isRecommended ? 'rgba(34,211,238,0.05)' : 'rgba(30,41,59,0.5)',
                  border: `1px solid ${label.isRecommended ? 'rgba(34,211,238,0.3)' : 'rgba(148,163,184,0.08)'}`,
                  borderRadius: '0.75rem',
                }}>
                  {/* Recommended status toggle */}
                  <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id={`isRec-${label.id}`} checked={label.isRecommended}
                      onChange={async e => {
                        const checked = e.target.checked
                        // Optimistic state update
                        setTiers(prev => prev.map(t => ({
                          ...t,
                          plans: t.plans.map(p => {
                            if (p.id !== plan.id) return p
                            return {
                              ...p,
                              labels: p.labels.map(l => l.id === label.id ? { ...l, isRecommended: checked } : l)
                            }
                          })
                        })))
                        await savePlanLabel(label.id, 'isRecommended', checked)
                      }}
                      style={{ width: 'auto', cursor: 'pointer' }} />
                    <label htmlFor={`isRec-${label.id}`} style={{ fontSize: '0.8125rem', color: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}>
                      ⭐ 推荐此套餐
                    </label>
                  </div>

                  {/* Duration */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>时长</label>
                    <input style={inputStyle} defaultValue={label.duration}
                      onBlur={e => { if (e.target.value !== label.duration) savePlanLabel(label.id, 'duration', e.target.value) }} />
                  </div>

                  {/* Currency & Prices */}
                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>货币</label>
                      <input style={inputStyle} defaultValue={label.currencySymbol}
                        onBlur={e => {
                          const val = e.target.value.trim()
                          if (val && val !== label.currencySymbol) {
                            savePlanLabel(label.id, 'currencySymbol', val)
                            // Optimistically update currency label
                            setTiers(prev => prev.map(t => ({
                              ...t,
                              plans: t.plans.map(p => {
                                if (p.id !== plan.id) return p
                                return {
                                  ...p,
                                  labels: p.labels.map(l => l.id === label.id ? { ...l, currencySymbol: val } : l)
                                }
                              })
                            })))
                          }
                        }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>现价 ({label.currencySymbol})</label>
                      <input type="number" step="0.01" style={inputStyle} defaultValue={label.price}
                        onBlur={e => {
                          const val = parseFloat(e.target.value)
                          if (val !== label.price) savePlanLabel(label.id, 'price', val)
                        }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>原价 ({label.currencySymbol})</label>
                      <input type="number" step="0.01" style={inputStyle} defaultValue={label.originalPrice ?? ''}
                        onBlur={e => {
                          const val = e.target.value ? parseFloat(e.target.value) : null
                          if (val !== label.originalPrice) savePlanLabel(label.id, 'originalPrice', val)
                        }} />
                    </div>
                  </div>

                  {/* CTA Text */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>按钮文字</label>
                    <input style={inputStyle} defaultValue={label.ctaText}
                      onBlur={e => { if (e.target.value !== label.ctaText) savePlanLabel(label.id, 'ctaText', e.target.value) }} />
                  </div>

                  {/* CTA Subtext */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>按钮下方提示文案</label>
                    <input style={inputStyle} defaultValue={label.subText ?? ''}
                      onBlur={e => { if (e.target.value !== label.subText) savePlanLabel(label.id, 'subText', e.target.value) }} />
                  </div>

                  {/* WA Message */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>WhatsApp 预设消息</label>
                    <textarea rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                      defaultValue={label.waMessage}
                      onBlur={e => { if (e.target.value !== label.waMessage) savePlanLabel(label.id, 'waMessage', e.target.value) }} />
                  </div>

                  {/* Features */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      功能列表（每行一条）
                    </label>
                    <textarea rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                      defaultValue={features.join('\n')}
                      onBlur={e => {
                        const lines = e.target.value.split('\n').filter(l => l.trim())
                        savePlanLabel(label.id, 'features', JSON.stringify(lines))
                      }} />
                  </div>

                  {saving && saving.startsWith(label.id) && <div style={{ fontSize: '0.75rem', color: '#a855f7', marginTop: '0.5rem' }}>保存中...</div>}
                  {saved && saved.startsWith(label.id) && <div style={{ fontSize: '0.75rem', color: '#22d3ee', marginTop: '0.5rem' }}>✅ 已保存</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
