'use client'

import { useState, useEffect } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

interface PageSeo {
  locale: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  robots: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
}

interface SchemaConfig {
  orgName: string
  orgUrl: string
  orgLogoUrl: string
  orgPhone: string
  orgEmail: string
  orgAddress: string
  ratingValue: number
  reviewCount: number
  priceMin: number
  priceMax: number
  priceCurrency: string
}

interface SiteSettings {
  googleSiteVerification: string
  bingSiteVerification: string
  robotsTxt: string
  siteDomain: string
}

export default function SeoPage() {
  const { showPermissionAlert } = usePermission()
  const [activeTab, setActiveTab] = useState<'meta' | 'schema' | 'crawler'>('meta')
  const [activeLocale, setActiveLocale] = useState<'es'>('es')
  const [data, setData] = useState<Partial<PageSeo>>({})
  const [schemaData, setSchemaData] = useState<Partial<SchemaConfig>>({})
  const [settingsData, setSettingsData] = useState<Partial<SiteSettings>>({})
  const [personalizedData, setPersonalizedData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch Meta SEO
  useEffect(() => {
    if (activeTab === 'meta') {
      setLoading(true)
      fetch(`/api/admin/seo?locale=${activeLocale}`)
        .then(r => r.json())
        .then(d => {
          setData(d ?? {})
          setLoading(false)
        })
    }
  }, [activeLocale, activeTab])

  // Fetch Schema Config
  useEffect(() => {
    if (activeTab === 'schema') {
      setLoading(true)
      fetch(`/api/admin/seo/schema?locale=${activeLocale}`)
        .then(r => r.json())
        .then(d => {
          setSchemaData(d ?? {})
          setLoading(false)
        })
    }
  }, [activeLocale, activeTab])

  // Fetch SiteSettings (for Robots.txt / Site Verification)
  useEffect(() => {
    if (activeTab === 'crawler') {
      setLoading(true)
      Promise.all([
        fetch('/api/admin/settings').then(r => r.json()),
        fetch(`/api/admin/personalized?locale=${activeLocale}`).then(r => r.json())
      ])
        .then(([settings, personalized]) => {
          setSettingsData(settings ?? {})
          setPersonalizedData(personalized ?? {})
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [activeLocale, activeTab])

  const save = async () => {
    setSaving(true)
    try {
      let res;
      if (activeTab === 'meta') {
        res = await fetch('/api/admin/seo', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: activeLocale, ...data }),
        })
      } else if (activeTab === 'schema') {
        res = await fetch('/api/admin/seo/schema', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...schemaData, id: activeLocale }),
        })
      } else if (activeTab === 'crawler') {
        const results = await Promise.all([
          fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData),
          }),
          fetch('/api/admin/personalized', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale: activeLocale, ...personalizedData }),
          })
        ])
        if (results.some(r => r.status === 403)) {
          showPermissionAlert()
          return
        }
        if (results.some(r => !r.ok)) {
          alert('保存失败，请重试')
          return
        }
      }

      if (res) {
        if (res.status === 403) {
          showPermissionAlert()
          return
        }
        if (!res.ok) {
          alert('保存失败，请重试')
          return
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }


  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '0.5rem', color: '#f1f5f9',
    fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box',
  }

  const field = (key: keyof PageSeo, label: string, maxLen?: number, isTextarea?: boolean) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8' }}>{label}</label>
        {maxLen && <span style={{ fontSize: '0.75rem', color: (data[key]?.length ?? 0) > maxLen ? '#f87171' : '#64748b' }}>
          {data[key]?.length ?? 0} / {maxLen}
        </span>}
      </div>
      {isTextarea ? (
        <textarea rows={3} value={data[key] ?? ''} onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
      ) : (
        <input type="text" value={data[key] ?? ''} onChange={e => setData(p => ({ ...p, [key]: e.target.value }))}
          style={inputStyle} />
      )}
    </div>
  )

  const schemaField = (key: keyof SchemaConfig, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
        {label}
      </label>
      <input
        type={type}
        value={schemaData[key] ?? ''}
        placeholder={placeholder}
        onChange={e => setSchemaData(p => ({ ...p, [key]: e.target.value }))}
        style={inputStyle}
      />
    </div>
  )

  const settingsField = (key: keyof SiteSettings, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
        {label}
      </label>
      <input
        type={type}
        value={settingsData[key] ?? ''}
        placeholder={placeholder}
        onChange={e => setSettingsData(p => ({ ...p, [key]: e.target.value }))}
        style={inputStyle}
      />
    </div>
  )

  const settingsTextarea = (key: keyof SiteSettings, label: string, rows = 6, placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={settingsData[key] ?? ''}
        placeholder={placeholder}
        onChange={e => setSettingsData(p => ({ ...p, [key]: e.target.value }))}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
      />
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: 700 }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>🔍 SEO 设置</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>配置 Meta 信息、Google 结构化 JSON-LD 以及爬虫收录数据</p>
        </div>
        <button onClick={save} disabled={saving} style={{
          padding: '0.625rem 1.5rem',
          background: saved ? '#10b981' : 'linear-gradient(90deg,#22d3ee,#a855f7)',
          border: 'none', borderRadius: '0.5rem',
          color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
        }}>
          {saved ? '✅ 已保存' : saving ? '保存中...' : '💾 保存'}
        </button>
      </div>

      {/* Primary Tabs selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(148,163,184,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('meta')} style={{
          background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 700,
          color: activeTab === 'meta' ? '#22d3ee' : '#94a3b8',
          borderBottom: activeTab === 'meta' ? '2px solid #22d3ee' : 'none',
        }}>
          🔍 页面 Meta 标签 (Meta Tags)
        </button>
        <button onClick={() => setActiveTab('schema')} style={{
          background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 700,
          color: activeTab === 'schema' ? '#a855f7' : '#94a3b8',
          borderBottom: activeTab === 'schema' ? '2px solid #a855f7' : 'none',
        }}>
          📊 Schema.org 结构化数据 (JSON-LD)
        </button>
        <button onClick={() => setActiveTab('crawler')} style={{
          background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 700,
          color: activeTab === 'crawler' ? '#10b981' : '#94a3b8',
          borderBottom: activeTab === 'crawler' ? '2px solid #10b981' : 'none',
        }}>
          🌐 验证与爬虫 (Crawler & Verification)
        </button>
      </div>

      {/* Locale tabs (always visible so users can configure settings per language) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
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

      {loading ? (
        <div style={{ color: '#64748b', padding: '2rem 0' }}>加载中...</div>
      ) : activeTab === 'meta' ? (
        <div>

          <div style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee', marginBottom: '1.25rem' }}>基础 Meta</h2>
            {field('metaTitle', '页面标题 (title)', 65)}
            {field('metaDescription', '页面描述 (description)', 160, true)}
            {field('metaKeywords', '关键词 (keywords, 逗号分隔)')}
            {field('canonicalUrl', 'Canonical URL')}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
                Robots
              </label>
              <select value={data.robots ?? 'index, follow'}
                onChange={e => setData(p => ({ ...p, robots: e.target.value }))}
                style={{ ...inputStyle }}>
                <option value="index, follow">index, follow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, follow">noindex, follow</option>
              </select>
            </div>

            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a855f7', marginBottom: '1.25rem', marginTop: '1.5rem' }}>Open Graph (社交分享)</h2>
            {field('ogTitle', 'OG 标题（留空则使用页面标题）')}
            {field('ogDescription', 'OG 描述（留空则使用页面描述）', undefined, true)}
            {field('ogImageUrl', 'OG 图片 URL（建议 1200×630px）')}
          </div>
        </div>
      ) : activeTab === 'schema' ? (
        <div style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a855f7', marginBottom: '1.25rem' }}>🏢 组织机构设置 (Organization)</h2>
          {schemaField('orgName', '企业/组织名称', 'text', '例如: IPTV Pro')}
          {schemaField('orgUrl', '官网网址 (URL)', 'url', 'https://example.com')}
          {schemaField('orgLogoUrl', 'Logo 图片 URL', 'url', 'https://example.com/logo.png')}
          {schemaField('orgPhone', '联系电话 (电话号码前请保留+号与区号)', 'text', '+33 6 1234 5678')}
          {schemaField('orgEmail', '客服邮箱', 'email', 'support@example.com')}
          {schemaField('orgAddress', '办公地点/街道地址', 'text', 'Paris, France')}

          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee', marginBottom: '1.25rem', marginTop: '2rem' }}>⭐ Google 星级评价与价格区间 (Rich Snippet)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {schemaField('ratingValue', '星级平均分 (Max 5.0)', 'number', '4.8')}
            {schemaField('reviewCount', '总评价人数', 'number', '15000')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {schemaField('priceMin', '最低价', 'number', '6.99')}
            {schemaField('priceMax', '最高价', 'number', '39.99')}
            {schemaField('priceCurrency', '货币简称', 'text', 'EUR')}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
            设置后会自动在公共页面生成 JSON-LD 结构化数据，并在 Google 搜索结果中展示星级评分和价格区间富媒体摘要。
          </p>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(148,163,184,0.08)' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', marginBottom: '1.25rem' }}>🔍 搜索引擎所有权验证 ({activeLocale.toUpperCase()})</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
              Google Search Console 验证码
            </label>
            <input
              type="text"
              value={personalizedData.googleSiteVerification ?? ''}
              placeholder="例如: ABc123xyz..."
              onChange={e => setPersonalizedData({ ...personalizedData, googleSiteVerification: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
              Bing Webmaster 验证码
            </label>
            <input
              type="text"
              value={personalizedData.bingSiteVerification ?? ''}
              placeholder="例如: 1234567890ABCDEF..."
              onChange={e => setPersonalizedData({ ...personalizedData, bingSiteVerification: e.target.value })}
              style={inputStyle}
            />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            用于验证网站所有权。填入 HTML meta 标签 content 属性的值即可，系统会自动渲染在各语言页面的 &lt;head&gt; 中。
          </p>

          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee', marginBottom: '1.25rem', marginTop: '2rem' }}>🤖 爬虫规则与站点地图 (Robots.txt & Sitemap)</h2>
          {settingsTextarea('robotsTxt', 'Robots.txt 内容 (自定义规则)', 6, "User-agent: *\nAllow: /\nDisallow: /admin/")}
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            配置搜索引擎蜘蛛的抓取规则。系统会自动在文件尾部追加 Sitemap 声明。
          </p>

          <div style={{ padding: '1rem', background: 'rgba(15,23,42,0.4)', borderRadius: '0.5rem', border: '1px solid rgba(148,163,184,0.1)' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
              🗺️ 动态站点地图 (Sitemap.xml) 链接
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <a
                href={`${settingsData.siteDomain || ''}/sitemap.xml`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#22d3ee', fontSize: '0.85rem', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                {settingsData.siteDomain ? `${settingsData.siteDomain}/sitemap.xml` : 'sitemap.xml (点击查看)'}
              </a>
              <span style={{ color: '#64748b', fontSize: '0.725rem', lineHeight: 1.4 }}>
                站点地图是动态生成的，包含所有语言版本的首页（以及它们对应的 hreflang 多语言交织属性），有助于 Google 快速收录您的全部页面。
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

