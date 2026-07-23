import { NextResponse } from 'next/server'
import { verifyApiAuth } from '@/lib/api-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let buffer: Buffer
    let fileExt = 'jpg'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data field "file"' }, { status: 400 })
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds limit (max 10MB)' }, { status: 400 })
      }
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      fileExt = file.name.split('.').pop() || 'jpg'
    } else if (contentType.includes('application/json')) {
      const body = await req.json()
      const { base64, filename } = body
      if (!base64) {
        return NextResponse.json({ error: 'Missing "base64" string field in JSON payload' }, { status: 400 })
      }

      // Base64 regex parsing e.g. "data:image/png;base64,iVBORw0KGgo..."
      const matches = base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/)
      if (matches) {
        fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1]
        buffer = Buffer.from(matches[2], 'base64')
      } else {
        // Raw base64 string without data prefix
        buffer = Buffer.from(base64, 'base64')
        if (filename && filename.includes('.')) {
          fileExt = filename.split('.').pop() || 'jpg'
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Use "multipart/form-data" or "application/json"' },
        { status: 400 }
      )
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`
    const filepath = path.join(uploadsDir, uniqueFilename)

    await writeFile(filepath, buffer)

    const relativeUrl = `/uploads/${uniqueFilename}`
    
    // Construct absolute URL from request domain if host header is available
    const host = req.headers.get('host')
    const protocol = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    const absoluteUrl = host ? `${protocol}://${host}${relativeUrl}` : relativeUrl

    return NextResponse.json({
      ok: true,
      url: relativeUrl,
      absoluteUrl,
      filename: uniqueFilename,
    }, { status: 201 })

  } catch (err: any) {
    console.error('API Upload error:', err)
    return NextResponse.json({ error: 'Failed to upload image', details: err.message }, { status: 500 })
  }
}
