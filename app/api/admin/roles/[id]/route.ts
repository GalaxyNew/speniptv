import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

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

export async function PATCH(req: Request, { params }: Params) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { id } = await params
  const target = await db.role.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  // Safety check: protect the 'admin' role from modifications
  if (target.name.toLowerCase() === 'admin') {
    return NextResponse.json({ error: 'Cannot modify the system "admin" role' }, { status: 400 })
  }

  try {
    const data = await req.json()
    const { name, permissions } = data
    const updateData: Record<string, string> = {}

    if (name) {
      const trimmedName = name.trim()
      if (trimmedName.toLowerCase() === 'admin') {
        return NextResponse.json({ error: 'Cannot rename a role to "admin"' }, { status: 400 })
      }
      // Check duplicate
      const duplicate = await db.role.findUnique({ where: { name: trimmedName } })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
      }
      updateData.name = trimmedName
    }

    if (permissions !== undefined) {
      updateData.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions)
    }

    const updated = await db.role.update({
      where: { id },
      data: updateData,
    })

    // Log role update
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    const changedFields = Object.keys(updateData)
    const fieldMapping: Record<string, string> = {
      name: '角色名称',
      permissions: '权限配置'
    }
    const changedFieldsChinese = changedFields.map(f => fieldMapping[f] || f)
    await logAction(operator, '修改角色', target.name, `修改了角色属性，更新的字段为: ${changedFieldsChinese.join(', ')}`)

    return NextResponse.json(updated)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update role'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { id } = await params
  const target = await db.role.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  if (target.name.toLowerCase() === 'admin') {
    return NextResponse.json({ error: 'Cannot delete the system "admin" role' }, { status: 400 })
  }

  try {
    await db.role.delete({ where: { id } })

    // Log role deletion
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    await logAction(operator, '删除角色', target.name, `删除了角色 (角色ID: ${id})`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete role'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

