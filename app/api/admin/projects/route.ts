import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ledgerDir = join(process.cwd(), 'task-ledger')
    let files: string[] = []
    try {
      const entries = await readdir(ledgerDir)
      files = entries.filter((f) => f.endsWith('.json')).sort()
    } catch {
      // task-ledger directory doesn't exist yet
      return NextResponse.json([])
    }

    const tasks = []
    for (const file of files) {
      try {
        const raw = await readFile(join(ledgerDir, file), 'utf-8')
        const data = JSON.parse(raw)
        tasks.push(data)
      } catch {
        // skip malformed files
      }
    }

    return NextResponse.json(tasks)
  } catch (err) {
    console.error('Failed to read task ledger:', err)
    return NextResponse.json({ error: 'Failed to read task ledger' }, { status: 500 })
  }
}
