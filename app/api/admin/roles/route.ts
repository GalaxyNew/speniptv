import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'

// Enforce admin permission for accessing roles API
async function checkAdminAccess() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { authorized: false, error: 'Unauthorized', status: 401 }

  const me = await db.admin.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  })

  if (!me || (me.username !== 'admin' && me.role?.name !== 'admin')) {
    const operator = me?.username || session.user.name || 'unknown'
    await logAction(operator, '拒绝访问', null, '试图访问角色管理接口被拒绝 (原因: 缺少 admin 角色)')
    return { authorized: false, error: 'Access Denied: Admin role required', status: 403 }
  }

  return { authorized: true }
}

export async function GET() {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const roles = await db.role.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(roles)
}

export async function POST(req: Request) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const data = await req.json()
    const { name, permissions } = data

    if (!name || !permissions) {
      return NextResponse.json({ error: 'Role name and permissions are required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check duplicate
    const existing = await db.role.findUnique({
      where: { name: trimmedName },
    })
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }

    const newRole = await db.role.create({
      data: {
        name: trimmedName,
        permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      },
    })

    // Log role creation
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    await logAction(operator, '创建角色', trimmedName, `新建了角色，权限配置为: ${newRole.permissions}`)

    return NextResponse.json(newRole, { status: 201 })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create role'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

