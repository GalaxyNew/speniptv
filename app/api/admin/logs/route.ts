import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'

async function checkAdminAccess() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { authorized: false, error: 'Unauthorized', status: 401 }

  const me = await db.admin.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  })

  if (!me || (me.username !== 'admin' && me.role?.name !== 'admin')) {
    const operator = me?.username || session.user.name || 'unknown'
    await logAction(operator, '拒绝访问', null, '试图访问操作日志接口被拒绝 (原因: 缺少 admin 角色)')
    return { authorized: false, error: 'Access Denied: Admin role required', status: 403 }
  }

  return { authorized: true }
}

export async function GET(req: Request) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const operator = searchParams.get('operator') || ''
    const action = searchParams.get('action') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const andConditions: Record<string, unknown>[] = []

    // Search filter
    if (search) {
      andConditions.push({
        OR: [
          { operator: { contains: search } },
          { action: { contains: search } },
          { target: { contains: search } },
          { details: { contains: search } },
          { ip: { contains: search } },
        ],
      })
    }

    // Operator filter
    if (operator) {
      andConditions.push({
        operator: { contains: operator },
      })
    }

    // Action filter
    if (action) {
      if (action === 'CREATE') {
        andConditions.push({ action: { contains: 'CREATE' } })
      } else if (action === 'UPDATE') {
        andConditions.push({
          OR: [
            { action: { contains: 'UPDATE' } },
            { action: { contains: 'EDIT' } },
          ],
        })
      } else if (action === 'DELETE') {
        andConditions.push({ action: { contains: 'DELETE' } })
      } else if (action === 'LOGIN') {
        andConditions.push({ action: { contains: 'LOGIN' } })
      } else if (action === 'DENIED') {
        andConditions.push({
          OR: [
            { action: { contains: 'DENIED' } },
            { action: { contains: 'UNAUTHORIZED' } },
          ],
        })
      } else {
        andConditions.push({ action: { contains: action } })
      }
    }

    // Time filter
    if (startDate || endDate) {
      const timeCond: Record<string, Date> = {}
      if (startDate) {
        timeCond.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        timeCond.lte = end
      }
      andConditions.push({ createdAt: timeCond })
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {}

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch logs'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
