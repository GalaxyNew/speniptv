import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logAction } from './audit'

// Extend NextAuth types to include id on session.user
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      permissions?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string | null
    permissions?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'Hv7}L(h6i-Tk+T#6-secret-iptv',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const admin = await db.admin.findUnique({
          where: { username: credentials.username },
          include: { role: true },
        })

        if (!admin) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          admin.password
        )

        if (!passwordMatch) return null

        // Log successful login
        await logAction(admin.username, '登录成功', admin.username, '通过密码凭据登录后台成功')

        return {
          id: admin.id,
          name: admin.username,
          email: null,
          role: admin.role?.name || null,
          permissions: admin.role?.permissions || null,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as Record<string, unknown>).role as string | null
        token.permissions = (user as unknown as Record<string, unknown>).permissions as string | null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | null
        session.user.permissions = token.permissions as string | null
      }
      return session
    },
  },
}
