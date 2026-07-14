'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as LucideIcons from 'lucide-react'

interface EditableIconProps {
  moduleId: string
  locale: string
  fieldKey: string
  iconValue: string // Current icon name, emoji, or path
  iconSizeValue?: string | number // Current size
  iconColorValue?: string // Current color value
  defaultIcon: string
  defaultSize?: number
  defaultColor?: string
  isEditMode: boolean
  className?: string
  style?: React.CSSProperties
  onPermissionDenied?: () => void
}

// Curated list of popular icons by category for quick selection
const CURATED_ICONS = {
  popular: ['Tv', 'Smartphone', 'Laptop', 'Zap', 'ShieldCheck', 'Activity', 'Headphones', 'Film', 'Star', 'Trophy', 'Globe', 'Wifi'],
  devices: ['Tv2', 'Monitor', 'Tablet', 'Gamepad2', 'Flame', 'Router', 'HardDrive', 'Apple', 'Speaker', 'Volume2'],
  media: ['Play', 'Pause', 'Clapperboard', 'ListMusic', 'PlayCircle', 'Disc', 'Radio', 'Image'],
  features: ['Lock', 'Unlock', 'Settings', 'HelpCircle', 'Heart', 'CheckCircle2', 'AlertCircle', 'Sparkles', 'Clock', 'Compass', 'Users', 'Bell']
}

const PRESETS_COLORS = [
  { value: 'var(--accent-1)', label: '主题蓝/青', preview: '#22d3ee' },
  { value: 'var(--accent-2)', label: '主题紫/绿', preview: '#a855f7' },
  { value: 'var(--text-primary)', label: '主文字色', preview: '#f1f5f9' },
  { value: 'var(--text-secondary)', label: '副文字色', preview: '#94a3b8' },
  { value: '#ffffff', label: '纯白', preview: '#ffffff' },
  { value: '#fbbf24', label: '金黄', preview: '#fbbf24' },
  { value: '#10b981', label: '翡翠绿', preview: '#10b981' },
  { value: '#ef4444', label: '玫瑰红', preview: '#ef4444' },
]

export default function EditableIcon({
  moduleId,
  locale,
  fieldKey,
  iconValue,
  iconSizeValue,
  iconColorValue,
  defaultIcon,
  defaultSize = 36,
  defaultColor = 'var(--accent-1)',
  isEditMode,
  className,
  style,
  onPermissionDenied,
}: EditableIconProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<keyof typeof CURATED_ICONS | 'all'>('popular')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Resolve values for viewing
  const currentIcon = iconValue || defaultIcon
  const currentSize = iconSizeValue ? parseInt(iconSizeValue.toString(), 10) : defaultSize
  const currentColor = iconColorValue || defaultColor

  const presetsValues = useMemo(() => PRESETS_COLORS.map(c => c.value), [])
  const isCustomColor = iconColorValue && !presetsValues.includes(iconColorValue)

  // Local edit states inside modal
  const [selectedIcon, setSelectedIcon] = useState(currentIcon)
  const [selectedSize, setSelectedSize] = useState<number>(currentSize)
  const [selectedColor, setSelectedColor] = useState<string>(
    isCustomColor ? 'custom' : currentColor
  )
  const [customEmoji, setCustomEmoji] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customColor, setCustomColor] = useState(isCustomColor ? iconColorValue : '')

  // Get all Lucide icon names starting with uppercase
  const allIconNames = useMemo(() => {
    return Object.keys(LucideIcons).filter(
      key => /^[A-Z]/.test(key) && key !== 'LucideIcon' && typeof (LucideIcons as any)[key] !== 'undefined'
    )
  }, [])

  // Filtered icons for the "all/search" tab or general category matching
  const filteredIcons = useMemo(() => {
    if (activeCategory !== 'all' && !searchTerm) {
      return CURATED_ICONS[activeCategory]
    }
    const term = searchTerm.toLowerCase().trim()
    if (!term) return allIconNames.slice(0, 100) // Show first 100 if empty search under "all"
    return allIconNames.filter(name => name.toLowerCase().includes(term))
  }, [activeCategory, searchTerm, allIconNames])

  // Save selected icon, size and color to db
  const handleSave = async () => {
    let finalIcon = selectedIcon
    if (customEmoji.trim()) {
      finalIcon = customEmoji.trim()
    } else if (customUrl.trim()) {
      finalIcon = customUrl.trim()
    }

    let finalColor = selectedColor
    if (selectedColor === 'custom') {
      finalColor = customColor.trim() || defaultColor
    }

    try {
      // Save Icon
      const res1 = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, locale, key: fieldKey, value: finalIcon }),
      })
      if (res1.status === 403) {
        setIsOpen(false)
        onPermissionDenied?.()
        return
      }

      // Save Icon Size
      await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, locale, key: `${fieldKey}_size`, value: selectedSize.toString() }),
      })

      // Save Icon Color
      await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, locale, key: `${fieldKey}_color`, value: finalColor }),
      })

      setIsOpen(false)
      window.location.reload()
    } catch (e) {
      console.error('Failed to save icon:', e)
      alert('保存失败，请重试')
    }
  }

  // Renders the icon based on its type (Lucide icon, Image URL, Emoji, etc.)
  const renderIconContent = (icon: string, size: number, color: string) => {
    if (!icon) return null

    // Case 1: Image URL (relative path starting with '/' or absolute URL starting with 'http')
    if (icon.startsWith('/') || icon.startsWith('http')) {
      const isSvg = icon.toLowerCase().endsWith('.svg')
      if (isSvg && color) {
        return (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              maskImage: `url(${icon})`,
              WebkitMaskImage: `url(${icon})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              display: 'inline-block',
              flexShrink: 0,
              ...style,
            }}
            className={className}
          />
        )
      }
      return (
        <img
          src={icon}
          alt="icon"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
            ...style,
          }}
          className={className}
        />
      )
    }

    // Case 2: Lucide Icon component
    const IconComponent = (LucideIcons as any)[icon]
    if (IconComponent) {
      return (
        <IconComponent
          size={size}
          style={{ color: color, ...style }}
          className={className}
        />
      )
    }

    // Case 3: Emoji or plain text fallback
    return (
      <span
        style={{
          fontSize: `${size}px`,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${size}px`,
          height: `${size}px`,
          color,
          ...style,
        }}
        className={className}
      >
        {icon}
      </span>
    )
  }

  const renderedIcon = renderIconContent(currentIcon, currentSize, currentColor)

  if (!isEditMode) {
    return renderedIcon
  }

  return (
    <>
      {/* Clickable Icon Wrapper in Edit Mode */}
      <div
        onClick={() => {
          setSelectedIcon(currentIcon)
          setSelectedSize(currentSize)
          const isCust = iconColorValue && !presetsValues.includes(iconColorValue)
          setSelectedColor(isCust ? 'custom' : currentColor)
          setCustomColor(isCust ? iconColorValue : '')
          setCustomEmoji(currentIcon.length <= 4 && !currentIcon.startsWith('/') && !(LucideIcons as any)[currentIcon] ? currentIcon : '')
          setCustomUrl(currentIcon.startsWith('/') || currentIcon.startsWith('http') ? currentIcon : '')
          setIsOpen(true)
        }}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
          outline: '2px dashed rgba(34, 211, 238, 0.6)',
          outlineOffset: '4px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.outlineColor = 'rgba(34, 211, 238, 1)'
          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.06)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.outlineColor = 'rgba(34, 211, 238, 0.6)'
          e.currentTarget.style.background = 'transparent'
        }}
        title="点击更换图标与设置大小/颜色"
      >
        {renderedIcon}
      </div>

      {/* Modern Pop-up Icon Picker Modal */}
      {isOpen && mounted && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={() => setIsOpen(false)}
        >
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>🎨 选择图标与大小/颜色</h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Top Preview Card */}
            <div style={{
              background: '#0f172a',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(148, 163, 184, 0.08)',
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>当前预览 (Size: {selectedSize}px)</span>
                <span style={{ display: 'block', fontSize: '0.875rem', color: '#22d3ee', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                  {customEmoji.trim() ? `自定义Emoji: ${customEmoji}` : customUrl.trim() ? `自定义图片: URL` : `Lucide图标: ${selectedIcon}`}
                </span>
              </div>
              <div style={{
                width: 70, height: 70,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '0.5rem',
                border: '1px dashed rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {renderIconContent(
                  customEmoji.trim() ? customEmoji.trim() : customUrl.trim() ? customUrl.trim() : selectedIcon,
                  selectedSize > 64 ? 64 : selectedSize,
                  selectedColor === 'custom' ? customColor : selectedColor
                )}
              </div>
            </div>

            {/* Size Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ fontWeight: 600 }}>调整图标大小 (16px - 120px)</span>
                <span style={{ color: '#22d3ee', fontWeight: 700 }}>{selectedSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="120"
                value={selectedSize}
                onChange={(e) => setSelectedSize(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  accentColor: '#22d3ee',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Color Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>选择图标颜色</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {PRESETS_COLORS.map((preset) => {
                  const isPresetSelected = selectedColor === preset.value
                  return (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setSelectedColor(preset.value)
                        setCustomColor('')
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: preset.preview,
                        border: isPresetSelected ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isPresetSelected ? '0 0 8px #22d3ee' : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        position: 'relative',
                        transition: 'all 0.15s ease',
                      }}
                      title={preset.label}
                    />
                  )
                })}
                
                {/* Custom color option */}
                <button
                  onClick={() => {
                    setSelectedColor('custom')
                    if (!customColor) setCustomColor('#ffffff')
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: selectedColor === 'custom' ? '2px solid #22d3ee' : '1px solid rgba(255,255,255,0.2)',
                    background: selectedColor === 'custom' ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                    color: selectedColor === 'custom' ? '#22d3ee' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  自定义 🎨
                </button>

                {selectedColor === 'custom' && (
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColor.startsWith('#') && customColor.length === 7 ? customColor : '#ffffff'}
                      onChange={(e) => setCustomColor(e.target.value)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="#ffffff"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#0f172a',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '4px',
                        color: '#f1f5f9',
                        fontSize: '0.75rem',
                        width: '80px',
                        height: '28px',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Custom Emoji and Custom URL Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>输入自定义 Emoji</label>
                <input
                  type="text"
                  placeholder="如 ⚡"
                  value={customEmoji}
                  onChange={(e) => {
                    setCustomEmoji(e.target.value)
                    if (e.target.value.trim()) setCustomUrl('')
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '0.375rem',
                    color: '#f1f5f9',
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>输入自定义图片 URL / SVG 路径</label>
                <input
                  type="text"
                  placeholder="如 /images/icons/step1.svg"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value)
                    if (e.target.value.trim()) setCustomEmoji('')
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '0.375rem',
                    color: '#f1f5f9',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
            </div>

            {/* Curated / Search Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Category tabs */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                borderBottom: '1px solid rgba(148,163,184,0.1)',
                paddingBottom: '0.375rem',
                flexWrap: 'wrap'
              }}>
                {(['popular', 'devices', 'media', 'features', 'all'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat)
                      if (cat !== 'all') setSearchTerm('')
                    }}
                    style={{
                      background: activeCategory === cat ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                      border: 'none',
                      color: activeCategory === cat ? '#22d3ee' : '#94a3b8',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat === 'all' ? '全部/搜索 🔍' : cat === 'popular' ? '常用' : cat === 'devices' ? '设备' : cat === 'media' ? '播放' : '功能'}
                  </button>
                ))}
              </div>

              {/* Search input (visible only in 'all' tab or search) */}
              {(activeCategory === 'all' || searchTerm) && (
                <input
                  type="text"
                  placeholder="搜索图标名称 (如 TV, Smartphone, Shield...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '0.375rem',
                    color: '#f1f5f9',
                    fontSize: '0.8125rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              )}

              {/* Icon Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.375rem',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '0.25rem',
                background: '#0f172a',
                borderRadius: '0.5rem',
              }}>
                {filteredIcons.map((name) => {
                  const LucideComponent = (LucideIcons as any)[name]
                  const isSelected = selectedIcon === name && !customEmoji && !customUrl
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedIcon(name)
                        setCustomEmoji('')
                        setCustomUrl('')
                      }}
                      style={{
                        background: isSelected ? '#22d3ee' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isSelected ? '#22d3ee' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.375rem',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#0f172a' : '#f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={name}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#22d3ee'
                          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                        }
                      }}
                    >
                      {LucideComponent ? <LucideComponent size={20} /> : <span style={{ fontSize: '0.625rem' }}>{name}</span>}
                    </button>
                  )
                })}
                {filteredIcons.length === 0 && (
                  <div style={{ gridColumn: 'span 6', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
                    未找到匹配的图标
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: 'linear-gradient(90deg, #22d3ee, #a855f7)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(34, 211, 238, 0.25)',
                }}
              >
                保存配置
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
