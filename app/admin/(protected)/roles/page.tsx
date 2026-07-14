'use client'

import { useEffect, useState, useCallback } from 'react'

interface Role {
  id: string
  name: string
  permissions: string // stringified JSON Record<string, string>
}

const MODULES = [
  { key: 'modules', label: '📦 模块管理' },
  { key: 'content', label: '✏️ 内容编辑' },
  { key: 'subpages', label: '📄 页面管理' },
  { key: 'blog-posts', label: '📰 文章管理' },
  { key: 'blog-templates', label: '🗂️ 模板管理' },
  { key: 'pricing', label: '💰 定价管理' },
  { key: 'affiliate-links', label: '🔗 推广链接' },
  { key: 'seo', label: '🔍 SEO 设置' },
  { key: 'personalized', label: '🎨 个性设置' },
  { key: 'settings', label: '⚙️ 系统设置' },
]

const ACCESS_LEVELS = [
  { value: 'invisible', label: '不可见 (No Access)', color: '#64748b' },
  { value: 'readonly', label: '只读 (Read Only)', color: '#f59e0b' },
  { value: 'edit', label: '编辑 (Read & Write)', color: '#10b981' },
]

const DEFAULT_PERMISSIONS = {
  modules: 'invisible',
  content: 'invisible',
  subpages: 'invisible',
  'blog-posts': 'invisible',
  'blog-templates': 'invisible',
  pricing: 'invisible',
  'affiliate-links': 'invisible',
  seo: 'invisible',
  personalized: 'invisible',
  settings: 'invisible',
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [permissionsInput, setPermissionsInput] = useState<Record<string, string>>(DEFAULT_PERMISSIONS)
  const [saving, setSaving] = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/roles')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '获取角色列表失败')
      }
      setRoles(data)
    } catch (err: any) {
      setError(err.message || '加载角色列表出错，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const openAdd = () => {
    setEditingId(null)
    setNameInput('')
    setPermissionsInput(DEFAULT_PERMISSIONS)
    setShowForm(true)
  }

  const openEdit = (role: Role) => {
    setEditingId(role.id)
    setNameInput(role.name)
    let parsedPerms = { ...DEFAULT_PERMISSIONS }
    try {
      if (role.permissions) {
        parsedPerms = { ...DEFAULT_PERMISSIONS, ...JSON.parse(role.permissions) }
      }
    } catch (e) {}
    setPermissionsInput(parsedPerms)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      setError('角色名称不能为空')
      return
    }
    if (nameInput.trim().toLowerCase() === 'admin') {
      setError('不能使用系统保留的角色名称 "admin"')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        name: nameInput.trim(),
        permissions: JSON.stringify(permissionsInput),
      }

      const url = editingId ? `/api/admin/roles/${editingId}` : '/api/admin/roles'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }

      setMessage(editingId ? '角色更新成功！' : '角色创建成功！')
      setShowForm(false)
      fetchRoles()
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (name.toLowerCase() === 'admin') {
      alert('系统内置 admin 角色不可删除')
      return
    }
    if (!confirm(`您确定要删除角色 "${name}" 吗？此操作无法撤销。`)) {
      return
    }

    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '删除角色失败')
      }
      setMessage(`角色 "${name}" 已成功删除！`)
      fetchRoles()
    } catch (err: any) {
      setError(err.message || '删除角色操作失败')
    }
  }

  const updatePermission = (moduleKey: string, level: string) => {
    setPermissionsInput(prev => ({
      ...prev,
      [moduleKey]: level,
    }))
  }

  const getPermissionSummary = (permissionsStr: string) => {
    try {
      const perms = JSON.parse(permissionsStr) as Record<string, string>
      const editCount = Object.values(perms).filter(v => v === 'edit').length
      const readCount = Object.values(perms).filter(v => v === 'readonly').length
      return `可编辑 ${editCount} 个模块，只读 ${readCount} 个模块`
    } catch (e) {
      return '未配置权限'
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>🔑 角色管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>创建系统管理角色并为其授予模块只读、编辑或不可见的权限级别</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
          color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          ＋ 新增角色
        </button>
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
        ) : roles.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            没有其他自定义角色
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>角色名称</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>权限概要</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {/* Fixed Admin Display */}
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                    admin
                    <span style={{ fontSize: '0.75rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', padding: '0.15rem 0.35rem', borderRadius: 4, marginLeft: '0.5rem', verticalAlign: 'middle' }}>系统内置</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#a855f7', fontWeight: 600 }}>拥有系统所有模块的完全控制权限 (编辑/读取/可见)</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>不可编辑修改</td>
                </tr>

                {roles.filter(r => r.name !== 'admin').map(role => (
                  <tr key={role.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{role.name}</td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                      {getPermissionSummary(role.permissions)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEdit(role)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(34,211,238,0.4)',
                            background: 'rgba(34,211,238,0.1)',
                            color: '#22d3ee',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(role.id, role.name)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.4)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#f87171',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          删除
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

      {/* Role Create/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <form onSubmit={handleSave} style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 640,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button type="button" onClick={() => setShowForm(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: '1.5rem', cursor: 'pointer', outline: 'none',
            }}>&times;</button>

            <h3 style={{ margin: '0 0 1.5rem', color: '#22d3ee', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingId ? '✏️ 编辑权限角色' : '🔑 新增权限角色'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>角色名称</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="如：Editor、ReadOnly 等"
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>模块权限细分</label>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '0.5rem',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  background: 'rgba(15,23,42,0.4)',
                  padding: '1rem',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.1)',
                }}>
                  {MODULES.map(m => {
                    const currentLevel = permissionsInput[m.key] || 'invisible'
                    return (
                      <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{m.label}</span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {ACCESS_LEVELS.map(lvl => (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => updatePermission(m.key, lvl.value)}
                              style={{
                                padding: '0.35rem 0.625rem',
                                borderRadius: 6,
                                border: currentLevel === lvl.value ? `1px solid ${lvl.color}` : '1px solid rgba(148,163,184,0.1)',
                                background: currentLevel === lvl.value ? `${lvl.color}15` : 'transparent',
                                color: currentLevel === lvl.value ? lvl.color : '#64748b',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {lvl.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
                  background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
      
    </div>
  )
}
