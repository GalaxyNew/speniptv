'use client'

import { useEffect, useState } from 'react'

interface AuditLog {
  id: string
  operator: string
  action: string
  target: string | null
  details: string | null
  createdAt: string
  ip: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  })
  
  // Query parameters state
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [operator, setOperator] = useState('')
  const [operatorInput, setOperatorInput] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true)
        setError('')
      }
    })

    const query = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      search: search,
      operator: operator,
      action: action,
      startDate: startDate,
      endDate: endDate,
    })

    fetch(`/api/admin/logs?${query.toString()}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || '获取操作日志失败')
        }
        if (active) {
          setLogs(data.logs)
          setPagination(data.pagination)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || '加载日志数据出错')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [page, search, operator, action, startDate, endDate])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setOperator(operatorInput.trim())
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearch('')
    setOperatorInput('')
    setOperator('')
    setAction('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    setPage(newPage)
  }

  // Helper to render action badge with appropriate color
  const renderActionBadge = (actionName: string) => {
    let bg = 'rgba(148,163,184,0.15)'
    let text = '#94a3b8'

    if (actionName.includes('LOGIN')) {
      bg = 'rgba(16,185,129,0.15)'
      text = '#10b981'
    } else if (actionName.includes('CREATE')) {
      bg = 'rgba(34,211,238,0.15)'
      text = '#22d3ee'
    } else if (actionName.includes('UPDATE') || actionName.includes('EDIT')) {
      bg = 'rgba(245,158,11,0.15)'
      text = '#f59e0b'
    } else if (actionName.includes('DELETE')) {
      bg = 'rgba(239,68,68,0.15)'
      text = '#f87171'
    } else if (actionName.includes('DENIED') || actionName.includes('UNAUTHORIZED')) {
      bg = 'rgba(239,68,68,0.25)'
      text = '#ef4444'
    }

    return (
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
        padding: '0.2rem 0.5rem',
        borderRadius: 6,
        letterSpacing: '0.02em'
      }}>
        {actionName}
      </span>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: 'Outfit, Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--accent-1, #22d3ee)' }}>📋 操作日志</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>查看管理系统后台操作日志，跟踪敏感的账号、角色操作和登录事件</p>
        </div>
      </div>

      {/* Filter Control Dashboard */}
      <div style={{
        background: 'rgba(30,41,59,0.2)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: 14,
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <form onSubmit={handleFilterSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>关键字搜索</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索详情、目标等..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#f1f5f9',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>操作账号</label>
            <input
              type="text"
              value={operatorInput}
              onChange={(e) => setOperatorInput(e.target.value)}
              placeholder="输入操作用户名..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#f1f5f9',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>操作类型</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#f1f5f9',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">所有类型</option>
              <option value="LOGIN">🔑 登录记录</option>
              <option value="CREATE">＋ 新增操作</option>
              <option value="UPDATE">✏️ 修改操作</option>
              <option value="DELETE">🗑️ 删除操作</option>
              <option value="DENIED">🚫 无权限拦截</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>开始时间</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#f1f5f9',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>结束时间</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(148,163,184,0.15)',
                color: '#f1f5f9',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{
              flex: 1,
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
              color: '#22d3ee',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,211,238,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34,211,238,0.1)'}
            >
              🔍 筛选
            </button>
            <button type="button" onClick={handleClearFilters} style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(148,163,184,0.15)',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              重置
            </button>
          </div>
        </form>
      </div>

      {/* Error Info */}
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
        ) : logs.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            没有符合条件的操作日志
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(30,41,59,0.5)' }}>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>时间</th>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>操作人</th>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>IP地址</th>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>操作类型</th>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>操作目标</th>
                    <th style={{ padding: '1rem', color: '#94a3b8', fontWeight: 700 }}>详情</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                        {log.operator}
                      </td>
                      <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {log.ip || '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {renderActionBadge(log.action)}
                      </td>
                      <td style={{ padding: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
                        {log.target || '-'}
                      </td>
                      <td style={{ padding: '1rem', color: '#94a3b8', maxWidth: 400, wordBreak: 'break-all' }}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderTop: '1px solid rgba(148,163,184,0.08)',
                background: 'rgba(30,41,59,0.2)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  共 {pagination.total} 条日志，第 {pagination.page} / {pagination.totalPages} 页
                </span>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.15)',
                      background: pagination.page <= 1 ? 'transparent' : 'rgba(30,41,59,0.5)',
                      color: pagination.page <= 1 ? '#475569' : '#94a3b8',
                      cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.15)',
                      background: pagination.page >= pagination.totalPages ? 'transparent' : 'rgba(30,41,59,0.5)',
                      color: pagination.page >= pagination.totalPages ? '#475569' : '#94a3b8',
                      cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
