'use client'

import { useEffect, useState, useCallback } from 'react'

interface Role {
  id: string
  name: string
}

interface Account {
  id: string
  username: string
  createdAt: string
  roleId: string | null
  role: Role | null
}

export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [roleIdInput, setRoleIdInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [accRes, roleRes] = await Promise.all([
        fetch('/api/admin/accounts'),
        fetch('/api/admin/roles')
      ])

      const accData = await accRes.json()
      const roleData = await roleRes.json()

      if (!accRes.ok) throw new Error(accData.error || '获取账号列表失败')
      if (!roleRes.ok) throw new Error(roleData.error || '获取角色列表失败')

      setAccounts(accData)
      setRoles(roleData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载数据出错，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) {
        fetchData()
      }
    })
    return () => {
      active = false
    }
  }, [fetchData])

  const openAdd = () => {
    setEditingId(null)
    setUsernameInput('')
    setPasswordInput('')
    setRoleIdInput('')
    setShowForm(true)
  }

  const openEdit = (acc: Account) => {
    setEditingId(acc.id)
    setUsernameInput(acc.username)
    setPasswordInput('') // keep blank to not change password
    setRoleIdInput(acc.roleId || '')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameInput.trim()) {
      setError('用户名不能为空')
      return
    }
    if (!editingId && !passwordInput) {
      setError('新账号必须设置密码')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        username: usernameInput.trim(),
        roleId: roleIdInput || null,
        ...(passwordInput && { password: passwordInput })
      }

      const url = editingId ? `/api/admin/accounts/${editingId}` : '/api/admin/accounts'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }

      setMessage(editingId ? '账号更新成功！' : '账号创建成功！')
      setShowForm(false)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (username === 'admin') {
      alert('超级管理员账号(admin)不可删除')
      return
    }
    if (!confirm(`您确定要删除账号 "${username}" 吗？此操作无法撤销。`)) {
      return
    }

    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '删除账号失败')
      }
      setMessage(`账号 "${username}" 已成功删除！`)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除账号失败')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>👤 账号管理</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>配置管理系统后台操作账号，并为账号关联对应的权限角色</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--accent-gradient, linear-gradient(90deg,#22d3ee,#a855f7))',
          color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1.25rem',
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          ＋ 新增账号
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
        ) : accounts.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            没有其他操作账号
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>用户名</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>关联角色</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>创建时间</th>
                  <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {acc.username}
                      {acc.username === 'admin' && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(34,211,238,0.15)', color: '#22d3ee', padding: '0.15rem 0.35rem', borderRadius: 4, marginLeft: '0.5rem', verticalAlign: 'middle' }}>主管理员</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {acc.username === 'admin' ? (
                        <span style={{ color: '#a855f7', fontWeight: 600 }}>所有权限 (admin)</span>
                      ) : acc.role ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{acc.role.name}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>未分配 (无权限)</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                      {new Date(acc.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEdit(acc)}
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
                        {acc.username !== 'admin' && (
                          <button
                            onClick={() => handleDelete(acc.id, acc.username)}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Create/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <form onSubmit={handleSave} style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440,
            border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button type="button" onClick={() => setShowForm(false)} style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: '1.5rem', cursor: 'pointer', outline: 'none',
            }}>&times;</button>

            <h3 style={{ margin: '0 0 1.5rem', color: '#22d3ee', fontSize: '1.25rem', fontWeight: 800 }}>
              {editingId ? '✏️ 编辑操作账号' : '👤 新建操作账号'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>用户名</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="请输入后台登录用户名"
                  disabled={editingId !== null && usernameInput === 'admin'}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                    opacity: (editingId !== null && usernameInput === 'admin') ? 0.6 : 1,
                    cursor: (editingId !== null && usernameInput === 'admin') ? 'not-allowed' : 'text',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {editingId ? '修改密码 (留空则不修改)' : '登录密码'}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder={editingId ? '••••••••' : '设置登录密码'}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>分配权限角色</label>
                <select
                  value={roleIdInput}
                  onChange={e => setRoleIdInput(e.target.value)}
                  disabled={editingId !== null && usernameInput === 'admin'}
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem', borderRadius: 8, fontSize: '0.9rem',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box',
                    opacity: (editingId !== null && usernameInput === 'admin') ? 0.6 : 1,
                    cursor: (editingId !== null && usernameInput === 'admin') ? 'not-allowed' : 'pointer',
                  }}
                >
                  {editingId !== null && usernameInput === 'admin' ? (
                    <option value="">所有权限 (admin)</option>
                  ) : (
                    <>
                      <option value="">未分配 (没有任何权限)</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </>
                  )}
                </select>
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
