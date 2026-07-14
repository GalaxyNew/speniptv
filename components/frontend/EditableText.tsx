'use client'

import { useRef, useTransition, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface EditableTextProps {
  moduleId: string
  locale: string
  fieldKey: string
  tag?: keyof React.JSX.IntrinsicElements
  children: React.ReactNode
  isEditMode: boolean
  className?: string
  style?: React.CSSProperties
  onSave?: (value: string) => void
  onPermissionDenied?: () => void
  placeholder?: string
  multiline?: boolean
  noLink?: boolean
}

const formatHref = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url
  }
  return `https://${url}`
}

const isExternalLink = (url: string) => {
  if (!url) return false
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return false
  }
  return true
}

const fontPresets = [
  { name: 'Default (主题默认)', value: '' },
  { name: 'Outfit (时尚潮牌)', value: 'Outfit' },
  { name: 'Inter (极简冷风)', value: 'Inter' },
  { name: 'Poppins (圆润现代)', value: 'Poppins' },
  { name: 'Montserrat (大气几何)', value: 'Montserrat' },
  { name: 'Space Grotesk (未来极客)', value: 'Space Grotesk' },
  { name: 'Playfair Display (优雅宋体)', value: 'Playfair Display' },
  { name: 'Cormorant Garamond (奢华衬线)', value: 'Cormorant Garamond' },
  { name: 'Cinzel (古典石碑)', value: 'Cinzel' },
  { name: 'Syne (前卫艺术)', value: 'Syne' },
]

const gradientPresets = [
  { name: 'Sunset (日落粉橙)', value: 'linear-gradient(135deg, #f43f5e, #fb923c)' },
  { name: 'Cyber (赛博霓虹)', value: 'linear-gradient(135deg, #22d3ee, #a855f7)' },
  { name: 'Emerald (翡翠海岸)', value: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { name: 'Amethyst (皇家紫罗兰)', value: 'linear-gradient(135deg, #6366f1, #a855f7)' },
  { name: 'Sunrise (金色晨曦)', value: 'linear-gradient(135deg, #fbbf24, #f97316)' },
  { name: 'Ocean (深海幽蓝)', value: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
  { name: 'Candy (甜美糖果)', value: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { name: 'Mint (冰爽薄荷)', value: 'linear-gradient(135deg, #34d399, #059669)' },
  { name: 'Fairy (梦幻姬粉)', value: 'linear-gradient(135deg, #ff007f, #7b61fe)' },
  { name: 'Flames (烈焰炙红)', value: 'linear-gradient(135deg, #ed1d24, #ff4d4d)' },
  { name: 'Gold (奢华金沙)', value: 'linear-gradient(135deg, #ca8a04, #eab308)' },
  { name: 'Aurora (极光炫彩)', value: 'linear-gradient(135deg, #059669, #a855f7)' },
  { name: 'Lilac (淡雅丁香)', value: 'linear-gradient(135deg, #a78bfa, #f472b6)' },
  { name: 'Steel (冷酷钢铁)', value: 'linear-gradient(135deg, #94a3b8, #475569)' },
]

const parseGradient = (str: string) => {
  const defaultVal = { color1: '#22d3ee', color2: '#a855f7', angle: '135' }
  if (!str) return defaultVal
  
  // If it's a solid color instead of gradient, return default gradient values
  if (!str.startsWith('linear-gradient')) {
    return defaultVal
  }

  // Regex to match hex codes or rgb/rgba/hsl/hsla values
  const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g
  const colors = str.match(colorRegex)
  
  const angleRegex = /(\d+)deg/
  const angleMatch = str.match(angleRegex)
  
  return {
    color1: colors && colors[0] ? colors[0] : '#22d3ee',
    color2: colors && colors[1] ? colors[1] : '#a855f7',
    angle: angleMatch ? angleMatch[1] : '135',
  }
}

export default function EditableText({
  moduleId,
  locale,
  fieldKey,
  tag,
  children,
  isEditMode,
  className,
  style,
  onSave,
  onPermissionDenied,
  placeholder,
  multiline = false,
  noLink = false,
}: EditableTextProps) {
  const Tag = tag || (multiline ? 'div' : 'span')
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLElement>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const parseInitial = () => {
    let rawStr = ''
    if (typeof children === 'string') {
      rawStr = children
    } else if (children) {
      rawStr = children.toString()
    }

    try {
      if (rawStr.trim().startsWith('{') && rawStr.trim().endsWith('}')) {
        const parsed = JSON.parse(rawStr)
        if (parsed && typeof parsed === 'object' && 'text' in parsed) {
          return {
            text: parsed.text || '',
            href: parsed.href || '',
            font: parsed.font || '',
            gradient: parsed.gradient || '',
            hidden: parsed.hidden === true || parsed.hidden === 'true',
            extra: parsed,
          }
        }
      }
    } catch (e) {}

    return {
      text: rawStr,
      href: '',
      font: '',
      gradient: '',
      hidden: false,
      extra: null,
    }
  }

  const initial = parseInitial()
  const [textVal, setTextVal] = useState(initial.text)
  const [hrefVal, setHrefVal] = useState(initial.href)
  const [fontVal, setFontVal] = useState(initial.font)
  const [gradientVal, setGradientVal] = useState(initial.gradient)
  const [hiddenVal, setHiddenVal] = useState(initial.hidden)
  const [hovered, setHovered] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    zIndex: 999999,
    visibility: 'hidden',
    width: 280,
  })
  const [colorTab, setColorTab] = useState<'preset' | 'solid' | 'gradient'>('preset')
  const [solidColor, setSolidColor] = useState('#38bdf8')
  const [gradColor1, setGradColor1] = useState('#22d3ee')
  const [gradColor2, setGradColor2] = useState('#a855f7')
  const [gradAngle, setGradAngle] = useState('135')

  // Set mounted status on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state variables from gradientVal when popover opens
  useEffect(() => {
    if (!showPopup) return

    if (!gradientVal) {
      setColorTab('preset')
    } else if (gradientVal.includes('gradient')) {
      setColorTab('gradient')
      const parsed = parseGradient(gradientVal)
      setGradColor1(parsed.color1)
      setGradColor2(parsed.color2)
      setGradAngle(parsed.angle)
    } else {
      setColorTab('solid')
      setSolidColor(gradientVal)
    }
  }, [showPopup, gradientVal])

  // Position popover and handle outside click / scroll / resize
  useEffect(() => {
    if (!showPopup) return

    const update = () => {
      if (wrapperRef.current && popoverRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const popoverRect = popoverRef.current.getBoundingClientRect()
        
        const popoverWidth = popoverRect.width || 280
        const popoverHeight = popoverRect.height || 350
        const spacing = 6

        // Determine vertical position
        let top = rect.top - popoverHeight - spacing
        if (fieldKey === 'badge' || top < 10) {
          // Open downwards if it is badge or if there's not enough space at the top
          top = rect.bottom + spacing
        }

        // Align center and clamp horizontal position within viewport
        let left = rect.left + rect.width / 2 - popoverWidth / 2
        const viewportWidth = window.innerWidth
        const margin = 12
        left = Math.max(margin, Math.min(left, viewportWidth - popoverWidth - margin))

        setPopoverStyle({
          position: 'fixed',
          top,
          left,
          width: popoverWidth,
          zIndex: 999999,
          visibility: 'visible',
        })
      }
    }

    // Handle outside clicks
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(e.target as Node) &&
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false)
      }
    }

    // Run measurement on next frame
    let frameId = requestAnimationFrame(() => {
      update()
    })

    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update, true)
    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update, true)
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showPopup, fieldKey, colorTab])

  // Sync state if children changes dynamically from parent
  useEffect(() => {
    const updated = parseInitial()
    setTextVal(updated.text)
    setHrefVal(updated.href)
    setFontVal(updated.font)
    setGradientVal(updated.gradient)
    setHiddenVal(updated.hidden)
  }, [children])

  const save = (text: string, href: string, font: string, gradient: string, hidden: boolean) => {
    let finalValue = ''
    if (initial.extra) {
      finalValue = JSON.stringify({
        ...initial.extra,
        text,
        href,
        font,
        gradient,
        hidden
      })
    } else {
      finalValue = (href || font || gradient || hidden)
        ? JSON.stringify({ text, href, font, gradient, hidden })
        : text
    }

    if (onSave) {
      onSave(finalValue)
    }

    startTransition(async () => {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, locale, key: fieldKey, value: finalValue }),
      })
      if (res.status === 403 && onPermissionDenied) {
        onPermissionDenied()
      }
    })
  }

  // Common styling for color / gradient text
  const applyGradientStyles = (grad: string): React.CSSProperties => {
    if (!grad) return {}
    if (grad.includes('gradient')) {
      return {
        backgroundImage: grad,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
      }
    }
    return {
      color: grad,
      backgroundImage: 'none',
      WebkitBackgroundClip: 'initial',
      WebkitTextFillColor: 'initial',
      backgroundClip: 'initial',
      display: 'inline-block',
    }
  }

  const textStyles: React.CSSProperties = {
    ...style,
    fontFamily: fontVal ? `"${fontVal}", sans-serif` : undefined,
    ...applyGradientStyles(gradientVal),
    whiteSpace: multiline ? 'pre-wrap' : undefined,
  }

  // Non-edit mode display
  if (!isEditMode) {
    if (initial.hidden) {
      return null
    }
    const element = <Tag className={className} style={textStyles}>{textVal || children}</Tag>
    if (hrefVal && !noLink) {
      const formattedHref = formatHref(hrefVal)
      return (
        <a 
          href={formattedHref} 
          target={isExternalLink(hrefVal) ? '_blank' : undefined} 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}
        >
          {element}
        </a>
      )
    }
    return element
  }

  const TagAny = Tag as any
  const isHidden = hiddenVal
  const hiddenStyles: React.CSSProperties = isHidden ? {
    opacity: 0.4,
    textDecoration: 'line-through',
    border: '1px dashed #f87171',
    padding: '0 4px',
    borderRadius: '4px',
  } : {}

  return (
    <span
      ref={wrapperRef}
      className={`editable-text-wrapper ${showPopup ? 'active-popup' : ''}`}
      style={{
        position: 'relative',
        display: style?.display || 'inline-block',
        maxWidth: '100%',
        verticalAlign: 'middle',
        zIndex: showPopup ? 999999 : undefined,
      }}
    >
      <style>{`
        .editable-text-wrapper .floating-style-btn {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .editable-text-wrapper:hover .floating-style-btn,
        .editable-text-wrapper:focus-within .floating-style-btn,
        .editable-text-wrapper.active-popup .floating-style-btn {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .editable-text-wrapper.active-popup {
          z-index: 999999 !important;
        }
        .editable-text-wrapper [contenteditable]:empty::before {
          content: attr(placeholder);
          color: #64748b;
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>

      <TagAny
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-editable="true"
        className={className}
        placeholder={placeholder}
        style={{
          ...style,
          fontFamily: fontVal ? `${fontVal}, sans-serif` : undefined,
          ...applyGradientStyles(gradientVal),
          display: style?.display || 'inline-block',
          outline: isPending ? '2px solid var(--accent-2)' : undefined,
          minWidth: 20,
          cursor: 'text',
          ...hiddenStyles,
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          const newVal = e.currentTarget.innerText
          setTextVal(newVal)
          save(newVal, hrefVal, fontVal, gradientVal, hiddenVal)
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' && !multiline) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      >
        {textVal}
      </TagAny>

      {/* Floating Brush/Gear Trigger */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowPopup(!showPopup)
        }}
        className="floating-style-btn"
        contentEditable={false}
        style={{
          position: 'absolute',
          top: -24,
          right: 0,
          background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
          border: 'none',
          borderRadius: '50%',
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          zIndex: 9999,
          fontSize: '10px',
          color: 'white',
          transition: 'all 0.2s ease',
        }}
        title="文本样式与链接"
      >
        🎨
      </button>

      {/* Floating Settings Popover */}
      {mounted && showPopup && createPortal(
        <div
          ref={popoverRef}
          contentEditable={false}
          style={{
            ...popoverStyle,
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            textAlign: 'left',
            fontFamily: 'Outfit, Inter, system-ui, sans-serif',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '0.375rem', color: '#38bdf8' }}>
            ✨ 文字样式与链接设置
          </div>

          {/* 0. Visibility Option (Show/Hide) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' }}>是否显示该文本 (Visibility)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { value: false, label: '显示 (Show)' },
                { value: true, label: '隐藏 (Hide)' }
              ].map((opt) => {
                const isSelected = hiddenVal === opt.value
                return (
                  <button
                    key={opt.label}
                    onClick={(e) => {
                      e.preventDefault()
                      setHiddenVal(opt.value)
                    }}
                    style={{
                      flex: 1,
                      padding: '0.375rem',
                      borderRadius: '0.375rem',
                      border: '1px solid',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: isSelected ? '#10b981' : 'transparent',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      borderColor: isSelected ? '#10b981' : 'rgba(148,163,184,0.2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 1. Link Option */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' }}>超链接 URL (Hyperlink)</label>
            <input
              type="text"
              value={hrefVal}
              onChange={(e) => setHrefVal(e.target.value)}
              placeholder="https://... 或 #pricing"
              style={{
                width: '100%',
                padding: '0.375rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#1e293b',
                color: '#ffffff',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 2. Font Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' }}>个性化字体 (Font Family)</label>
            <select
              value={fontVal}
              onChange={(e) => setFontVal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: '#1e293b',
                color: '#ffffff',
                fontSize: '0.75rem',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              {fontPresets.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Color Tabs Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.375rem' }}>文本颜色与渐变 (Text Color & Gradient)</label>
            
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '0.375rem', marginBottom: '0.5rem', gap: '0.25rem' }}>
              {[
                { id: 'preset', label: '🎨 预设' },
                { id: 'solid', label: '⬤ 单色' },
                { id: 'gradient', label: '▧ 渐变' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault()
                    setColorTab(tab.id as any)
                    if (tab.id === 'preset') {
                      setGradientVal('')
                    } else if (tab.id === 'solid') {
                      setGradientVal(solidColor)
                    } else if (tab.id === 'gradient') {
                      setGradientVal(`linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    borderRadius: '0.25rem',
                    border: 'none',
                    background: colorTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: colorTab === tab.id ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Presets */}
            {colorTab === 'preset' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <button
                    onClick={() => setGradientVal('')}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: gradientVal === '' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      background: '#1e293b',
                      color: gradientVal === '' ? '#38bdf8' : '#94a3b8',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: gradientVal === '' ? '0 0 8px #38bdf8' : 'none',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    title="无 (None)"
                  >
                    ×
                  </button>
                  {gradientPresets.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => setGradientVal(g.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: gradientVal === g.value ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        background: g.value,
                        cursor: 'pointer',
                        boxShadow: gradientVal === g.value ? '0 0 8px #ffffff' : '0 2px 4px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                      title={g.name}
                    />
                  ))}
                </div>
                {/* Custom gradient input */}
                <input
                  type="text"
                  value={gradientVal}
                  onChange={(e) => setGradientVal(e.target.value)}
                  placeholder="或输入自定义 linear-gradient(...)"
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginTop: '0.25rem',
                  }}
                />
              </div>
            )}

            {/* Tab 2: Custom Solid Color */}
            {colorTab === 'solid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', cursor: 'pointer', background: solidColor, flexShrink: 0 }}>
                  <input
                    type="color"
                    value={solidColor.startsWith('#') && solidColor.length === 7 ? solidColor : '#38bdf8'}
                    onChange={(e) => {
                      setSolidColor(e.target.value)
                      setGradientVal(e.target.value)
                    }}
                    style={{
                      position: 'absolute',
                      top: -5,
                      left: -5,
                      width: 42,
                      height: 42,
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={solidColor}
                  onChange={(e) => {
                    setSolidColor(e.target.value)
                    setGradientVal(e.target.value)
                  }}
                  placeholder="#38bdf8"
                  style={{
                    flex: 1,
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Tab 3: Custom Gradient Builder */}
            {colorTab === 'gradient' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Color 1 Picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', cursor: 'pointer', background: gradColor1, flexShrink: 0 }}>
                      <input
                        type="color"
                        value={gradColor1.startsWith('#') && gradColor1.length === 7 ? gradColor1 : '#22d3ee'}
                        onChange={(e) => {
                          setGradColor1(e.target.value)
                          setGradientVal(`linear-gradient(${gradAngle}deg, ${e.target.value}, ${gradColor2})`)
                        }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          left: -5,
                          width: 34,
                          height: 34,
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={gradColor1}
                      onChange={(e) => {
                        setGradColor1(e.target.value)
                        setGradientVal(`linear-gradient(${gradAngle}deg, ${e.target.value}, ${gradColor2})`)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.25rem 0.375rem',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: '#1e293b',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>➔</span>

                  {/* Color 2 Picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden', cursor: 'pointer', background: gradColor2, flexShrink: 0 }}>
                      <input
                        type="color"
                        value={gradColor2.startsWith('#') && gradColor2.length === 7 ? gradColor2 : '#a855f7'}
                        onChange={(e) => {
                          setGradColor2(e.target.value)
                          setGradientVal(`linear-gradient(${gradAngle}deg, ${gradColor1}, ${e.target.value})`)
                        }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          left: -5,
                          width: 34,
                          height: 34,
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={gradColor2}
                      onChange={(e) => {
                        setGradColor2(e.target.value)
                        setGradientVal(`linear-gradient(${gradAngle}deg, ${gradColor1}, ${e.target.value})`)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.25rem 0.375rem',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: '#1e293b',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Angle slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.125rem' }}>
                    <span>渐变角度 (Angle)</span>
                    <span>{gradAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradAngle}
                    onChange={(e) => {
                      setGradAngle(e.target.value)
                      setGradientVal(`linear-gradient(${e.target.value}deg, ${gradColor1}, ${gradColor2})`)
                    }}
                    style={{
                      width: '100%',
                      accentColor: '#10b981',
                      cursor: 'pointer',
                      margin: '0.25rem 0',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {['0', '45', '90', '135', '180'].map((ang) => (
                      <button
                        key={ang}
                        onClick={(e) => {
                          e.preventDefault()
                          setGradAngle(ang)
                          setGradientVal(`linear-gradient(${ang}deg, ${gradColor1}, ${gradColor2})`)
                        }}
                        style={{
                          flex: 1,
                          padding: '0.15rem 0',
                          fontSize: '0.625rem',
                          borderRadius: '0.25rem',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          background: gradAngle === ang ? '#10b981' : '#1e293b',
                          color: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                save(textVal, hrefVal, fontVal, gradientVal, hiddenVal)
                setShowPopup(false)
              }}
              style={{
                flex: 1,
                padding: '0.4rem',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              应用并保存 (Save)
            </button>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                padding: '0.4rem 0.75rem',
                background: '#334155',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              取消
            </button>
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}
