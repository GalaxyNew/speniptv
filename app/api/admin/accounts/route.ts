import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/audit'

// Enforce admin permission for accessing account list/create
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

export async function GET() {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const accounts = await db.admin.findMany({
    include: { role: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Do not expose password hashes
  const safeAccounts = accounts.map((acc) => {
    const safeAcc = { ...acc } as Record<string, unknown>
    delete safeAcc.password
    return safeAcc
  })

  return NextResponse.json(safeAccounts)
}

export async function POST(req: Request) {
  const access = await checkAdminAccess()
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const data = await req.json()
    const { username, password, roleId } = data

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const trimmedUsername = username.trim()
    if (trimmedUsername.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Cannot create another "admin" root account' }, { status: 400 })
    }

    // Check if username already exists
    const existing = await db.admin.findUnique({
      where: { username: trimmedUsername },
    })
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newAccount = await db.admin.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        roleId: roleId || null,
      },
    })

    // Log account creation
    const session = await getServerSession(authOptions)
    const operator = session?.user?.name || 'unknown'
    let roleName = 'None'
    if (roleId) {
      const roleObj = await db.role.findUnique({ where: { id: roleId }, select: { name: true } })
      if (roleObj) roleName = roleObj.name
    }
    await logAction(operator, '创建账号', trimmedUsername, `新建了账号，分配角色为: ${roleName}`)

    const safeAccount = { ...newAccount } as Record<string, unknown>
    delete safeAccount.password
    return NextResponse.json(safeAccount, { status: 201 })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create account'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

