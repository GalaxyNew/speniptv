import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAction } from './audit'

const MODULE_NAMES: Record<string, string> = {
  dashboard: '仪表盘',
  modules: '模块管理',
  content: '内容编辑',
  subpages: '页面管理',
  'blog-posts': '文章管理',
  'blog-templates': '模板管理',
  pricing: '定价管理',
  'affiliate-links': '推广链接',
  seo: 'SEO 设置',
  personalized: '个性设置',
  settings: '系统设置',
  'recycle-bin': '回收站',
  accounts: '账号管理',
  roles: '角色管理',
  logs: '操作日志',
}

export async function verifyPermission(moduleKey: string, requiredAccess: 'readonly' | 'edit') {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  const userId = session.user.id
  // Find admin in DB to ensure fresh permission state
  const admin = await db.admin.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!admin) {
    return { authorized: false, error: 'User not found', status: 401 }
  }

  const operator = admin.username
  const moduleName = MODULE_NAMES[moduleKey] || moduleKey

  // The master root account 'admin' or any user with role named 'admin' gets full access
  if (admin.username === 'admin' || admin.role?.name === 'admin') {
    if (requiredAccess === 'edit') {
      await logAction(operator, '修改模块', null, `授权允许修改模块: ${moduleName} (超级管理员特权)`)
    }
    return { authorized: true }
  }

  // If the admin has no role assigned, deny access
  if (!admin.role) {
    const errorMsg = 'Access Denied: No role assigned'
    const detailMsg = '未分配角色，访问被拦截'
    await logAction(
      operator,
      requiredAccess === 'edit' ? '拒绝修改' : '拒绝读取',
      null,
      `试图访问 [${moduleName}] 模块被拒绝 (原因: ${detailMsg})`
    )
    return { authorized: false, error: errorMsg, status: 403 }
  }

  let permissions: Record<string, string> = {}
  try {
    permissions = JSON.parse(admin.role.permissions)
  } catch {
    const errorMsg = 'Access Denied: Invalid permissions configuration'
    const detailMsg = '权限配置解析失败'
    await logAction(
      operator,
      requiredAccess === 'edit' ? '拒绝修改' : '拒绝读取',
      null,
      `试图访问 [${moduleName}] 模块被拒绝 (原因: ${detailMsg})`
    )
    return { authorized: false, error: errorMsg, status: 403 }
  }

  const access = permissions[moduleKey]
  if (!access) {
    const errorMsg = 'Access Denied: No permissions for this module'
    const detailMsg = '无该模块的配置权限'
    await logAction(
      operator,
      requiredAccess === 'edit' ? '拒绝修改' : '拒绝读取',
      null,
      `试图访问 [${moduleName}] 模块被拒绝 (原因: ${detailMsg})`
    )
    return { authorized: false, error: errorMsg, status: 403 }
  }

  if (requiredAccess === 'readonly') {
    if (access === 'readonly' || access === 'edit') {
      return { authorized: true }
    }
  } else if (requiredAccess === 'edit') {
    if (access === 'edit') {
      await logAction(operator, '修改模块', null, `授权允许修改模块: ${moduleName}`)
      return { authorized: true }
    }
  }

  const errorMsg = 'Access Denied: Insufficient permissions'
  const detailMsg = '当前权限等级不足（只读或无权）'
  await logAction(
    operator,
    requiredAccess === 'edit' ? '拒绝修改' : '拒绝读取',
    null,
    `试图访问 [${moduleName}] 模块被拒绝 (原因: ${detailMsg})`
  )
  return { authorized: false, error: errorMsg, status: 403 }
}
