import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
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
    await logAction(operator, '拒绝访问', null, '试图访问账号管理接口被拒绝 (原因: 缺少 admin 角色)')
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
  const target = await db.admin.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  try {
    const data = await req.json()
    const { username, password, roleId } = data
    const updateData: Record<string, string | null> = {}

    // Root admin safety checks
    if (target.username === 'admin') {
      if (username && username !== 'admin') {
        return NextResponse.json({ error: 'Cannot rename the master "admin" account' }, { status: 400 })
      }
      if (roleId !== undefined && roleId !== target.roleId) {
        return NextResponse.json({ error: 'Cannot change role of the master "admin" account' }, { status: 400 })
      }
    }

    if (username) {
      const trimmedUsername = username.trim()
      // Check duplicate
      const duplicate = await db.admin.findUnique({ where: { username: trimmedUsername } })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
      updateData.username = trimmedUsername
    }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    if (roleId !== undefined) {
      updateData.roleId = roleId || null
    }

    const updated = await db.admin.update({
      where: { id },
      data: updateData,
    })

    // Log account update
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    const changedFields = Object.keys(updateData).filter(k => k !== 'password')
    if (updateData.password) changedFields.push('password')
    const fieldMapping: Record<string, string> = {
      username: '用户名',
      password: '密码',
      roleId: '角色'
    }
    const changedFieldsChinese = changedFields.map(f => fieldMapping[f] || f)
    await logAction(operator, '修改账号', target.username, `修改了账号属性，更新的字段为: ${changedFieldsChinese.join(', ')}`)

    const safeAccount = { ...updated } as Record<string, unknown>
    delete safeAccount.password
    return NextResponse.json(safeAccount)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update account'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { id } = await params
  const target = await db.admin.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  if (target.username === 'admin') {
    return NextResponse.json({ error: 'Cannot delete the master "admin" account' }, { status: 400 })
  }

  try {
    await db.admin.delete({ where: { id } })

    // Log account deletion
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    await logAction(operator, '删除账号', target.username, `删除了账号 (账号ID: ${id})`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete account'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

