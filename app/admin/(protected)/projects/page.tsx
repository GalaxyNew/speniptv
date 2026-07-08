'use client'

import { useState, useEffect, useMemo } from 'react'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  owner: string
  deadline: string
  created: string
  tags: string[]
}

type ViewMode = 'board' | 'list'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED:     { label: '已分配', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  IN_PROGRESS:  { label: '进行中', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  REVIEW:       { label: '待审核', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  PASSED:       { label: '已通过', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  BLOCKED:      { label: '已阻塞', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  REJECTED:     { label: '已拒绝', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  PAUSED:       { label: '已暂停', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  PENDING:      { label: '待处理', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  P0: { label: 'P0', color: '#f87171' },
  P1: { label: 'P1', color: '#fb923c' },
  P2: { label: 'P2', color: '#fbbf24' },
  P3: { label: 'P3', color: '#64748b' },
}

const BOARD_COLUMNS = ['ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'PASSED', 'BLOCKED'] as const

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/projects?t=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: Task[]) => { setTasks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'ALL') return tasks
    return tasks.filter((t) => t.status === statusFilter)
  }, [tasks, statusFilter])

  const stats = useMemo(() => {
    const s = { total: tasks.length, inProgress: 0, passed: 0, blocked: 0 }
    for (const t of tasks) {
      if (t.status === 'IN_PROGRESS') s.inProgress++
      else if (t.status === 'PASSED') s.passed++
      else if (t.status === 'BLOCKED') s.blocked++
    }
    return s
  }, [tasks])

  const card = (t: Task) => {
    const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING
    const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.P3
    return (
      <div
        key={t.id}
        style={{
          padding: '1rem',
          background: 'rgba(30,41,59,0.8)',
          border: '1px solid rgba(148,163,184,0.08)',
          borderRadius: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              color: pc.color,
              background: `${pc.color}18`,
              border: `1px solid ${pc.color}33`,
            }}
          >
            {pc.label}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#475569' }}>{t.id}</span>
        </div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem', lineHeight: 1.3 }}>
          {t.title}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>👤 {t.owner}</span>
          {t.deadline && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>📅 {t.deadline}</span>
          )}
        </div>
        {t.tags && t.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {t.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  color: '#94a3b8',
                  background: 'rgba(148,163,184,0.08)',
                  border: '1px solid rgba(148,163,184,0.12)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', color: '#f1f5f9' }}>
            📊 项目任务板
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            任务账本看板 · 数据来自 task-ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('board')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: viewMode === 'board' ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.6)',
              color: viewMode === 'board' ? '#22d3ee' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'board' ? 600 : 400,
            }}
          >
            📋 看板
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: viewMode === 'list' ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.6)',
              color: viewMode === 'list' ? '#22d3ee' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: viewMode === 'list' ? 600 : 400,
            }}
          >
            📝 列表
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: '总任务', value: stats.total, color: '#22d3ee', icon: '📦' },
          { label: '进行中', value: stats.inProgress, color: '#22d3ee', icon: '⚡' },
          { label: '已通过', value: stats.passed, color: '#34d399', icon: '✅' },
          { label: '已阻塞', value: stats.blocked, color: '#fb7185', icon: '🚫' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: '1.25rem',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.08)',
              borderRadius: '0.75rem',
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: '全部' },
          ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9999px',
              border: 'none',
              background: statusFilter === f.key ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.4)',
              color: statusFilter === f.key ? '#22d3ee' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>加载中...</div>
      )}

      {/* Empty */}
      {!loading && filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          <div>暂无任务数据。DevOps 需先运行 sync-task-ledger.sh 同步任务账本。</div>
        </div>
      )}

      {/* Board view */}
      {!loading && viewMode === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {BOARD_COLUMNS.map((col) => {
            const sc = STATUS_CONFIG[col]
            const colTasks = filteredTasks.filter((t) => t.status === col)
            return (
              <div key={col}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: `2px solid ${sc.color}33`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sc.color,
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: sc.color }}>{sc.label}</span>
                  <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                {colTasks.map(card)}
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {!loading && viewMode === 'list' && (
        <div
          style={{
            background: 'rgba(30,41,59,0.5)',
            border: '1px solid rgba(148,163,184,0.08)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>标题</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>优先级</th>
                <th style={thStyle}>负责人</th>
                <th style={thStyle}>截止</th>
                <th style={thStyle}>标签</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING
                const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.P3
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>{t.id}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.85rem', color: '#f1f5f9', fontWeight: 500 }}>{t.title}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          color: sc.color,
                          background: sc.bg,
                          border: `1px solid ${sc.color}33`,
                        }}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pc.color }}>{pc.label}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.owner}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.deadline || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {t.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '9999px',
                              color: '#94a3b8',
                              background: 'rgba(148,163,184,0.08)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle',
}
