'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePermission } from '@/components/admin/AdminShell'

interface BlogPost {
  id: string
  title: string
  slug: string
  locale: string
  category: string
  status: string
  deletedAt: string | null
}

const LOCALES = ['es', 'fr', 'en', 'zh']

export default function RecycleBinPage() {
  const { canEdit } = usePermission()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLocale, setFilterLocale] = useState('all')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState('')
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [confirmRestoreTitle, setConfirmRestoreTitle] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDeletedPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/blog-posts?deleted=true')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '获取回收站数据失败')
      }
      setPosts(data)
    } catch (err: any) {
      setError(err.message || '网络请求出错，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeletedPosts()
  }, [fetchDeletedPosts])

  const handleRestore = async () => {
    if (!canEdit || !confirmRestoreId) return

    setActionLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/blog-posts/${confirmRestoreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false }),
      })
      const data = await res.json()
      if (res.status === 403) {
        throw new Error('当前无权限修改，请联系管理员！')
      }
      if (!res.ok) {
        throw new Error(data.error || '还原文章失败')
      }
      setMessage(`文章 "${confirmRestoreTitle}" 已成功还原！`)
      setConfirmRestoreId(null)
      setConfirmRestoreTitle('')
      fetchDeletedPosts()
    } catch (err: any) {
      setError(err.message || '还原操作出错')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (!canEdit || !confirmDeleteId) return

    setActionLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/blog-posts/${confirmDeleteId}?permanent=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.status === 403) {
        throw new Error('当前无权限修改，请联系管理员！')
      }
      if (!res.ok) {
        throw new Error(data.error || '永久删除文章失败')
      }
      setMessage(`文章 "${confirmDeleteTitle}" 已永久从数据库中删除！`)
      setConfirmDeleteId(null)
      setConfirmDeleteTitle('')
      fetchDeletedPosts()
    } catch (err: any) {
      setError(err.message || '永久删除操作出错')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter posts based on locale and search term
  const filteredPosts = posts.filter(post => {
    const matchesLocale = filterLocale === 'all' || post.locale === filterLocale
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || 
                          post.slug.toLowerCase().includes(search.toLowerCase())
    return matchesLocale && matchesSearch
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>🗑️ 回收站</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>查看已软删除的文章，你可以还原它们，或者永久将它们从数据库中清除</p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 10, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✅ {message}</span>
          <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 10, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}

      {/* Filters Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', ...LOCALES].map(l => (
            <button
              key={l}
              onClick={() => setFilterLocale(l)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 8,
                border: filterLocale === l ? '1px solid #22d3ee' : '1px solid rgba(148,163,184,0.15)',
                background: filterLocale === l ? 'rgba(34,211,238,0.12)' : 'rgba(30,41,59,0.4)',
                color: filterLocale === l ? '#22d3ee' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {l === 'all' ? '全部语言' : l.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="搜索已删除文章..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            width: '100%',
            maxWidth: 320,
            outline: 'none',
          }}
        />
      </div>

      {/* Main Table */}
      <div style={{
        background: 'rgba(30,41,59,0.3)',
        borderRadius: 14,
        border: '1px solid rgba(148,163,184,0.08)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>🍃</span>
            回收站为空，没有任何被删除的文章
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>文章标题</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>语言</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>链接别名 (Slug)</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>删除时间</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{post.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: post.locale === 'es' ? 'rgba(239,68,68,0.12)' : post.locale === 'fr' ? 'rgba(59,130,246,0.12)' : post.locale === 'en' ? 'rgba(16,185,129,0.12)' : 'rgba(168,85,247,0.12)',
                        color: post.locale === 'es' ? '#ef4444' : post.locale === 'fr' ? '#3b82f6' : post.locale === 'en' ? '#10b981' : '#a855f7',
                        border: post.locale === 'es' ? '1px solid rgba(239,68,68,0.25)' : post.locale === 'fr' ? '1px solid rgba(59,130,246,0.25)' : post.locale === 'en' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(168,85,247,0.25)',
                      }}>{post.locale.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>/{post.locale}/blog/{post.slug}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>
                      {post.deletedAt ? new Date(post.deletedAt).toLocaleString('zh-CN') : '未知'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setConfirmRestoreId(post.id)
                            setConfirmRestoreTitle(post.title)
                          }}
                          disabled={!canEdit || actionLoading}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(16,185,129,0.4)',
                            background: 'rgba(16,185,129,0.1)',
                            color: '#10b981',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: (!canEdit || actionLoading) ? 'not-allowed' : 'pointer',
                            opacity: (!canEdit || actionLoading) ? 0.6 : 1,
                          }}
                        >
                          还原
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(post.id)
                            setConfirmDeleteTitle(post.title)
                          }}
                          disabled={!canEdit || actionLoading}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.4)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: (!canEdit || actionLoading) ? 'not-allowed' : 'pointer',
                            opacity: (!canEdit || actionLoading) ? 0.6 : 1,
                          }}
                        >
                          永久删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440,
            border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#f87171', fontSize: '1.25rem', fontWeight: 800 }}>⚠️ 确认永久删除</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              此操作将永久删除文章 <strong>"{confirmDeleteTitle}"</strong>，且<strong>不可逆转</strong>。该文章将从数据库中被物理清除。您确定要继续吗？
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setConfirmDeleteId(null)
                  setConfirmDeleteTitle('')
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                取消
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={actionLoading}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                {actionLoading ? '删除中...' : '确定永久删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {confirmRestoreId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440,
            border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>♻️ 确认还原文章</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              您确定要还原文章 <strong>"{confirmRestoreTitle}"</strong> 吗？还原后该文章将重新在前台和站点地图中展示。
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setConfirmRestoreId(null)
                  setConfirmRestoreTitle('')
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                取消
              </button>
              <button
                onClick={handleRestore}
                disabled={actionLoading}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none',
                  background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                {actionLoading ? '还原中...' : '确定还原'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
