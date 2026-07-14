import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

// GET /api/admin/seo/schema?locale=...
export async function GET(req: Request) {
  const permission = await verifyPermission('seo', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { searchParams } = new URL(req.url)
  const locale = searchParams.get('locale') || 'fr'

  let schema = await db.schemaConfig.findUnique({ where: { id: locale } })
  
  if (!schema) {
    // Fallback/copy from 'main' or provide default
    const mainSchema = await db.schemaConfig.findUnique({ where: { id: 'main' } })
    if (mainSchema) {
      schema = { ...mainSchema, id: locale }
    } else {
      schema = {
        id: locale,
        orgName: '',
        orgUrl: '',
        orgLogoUrl: '',
        orgPhone: '',
        orgEmail: '',
        orgAddress: '',
        ratingValue: 4.8,
        reviewCount: 15000,
        priceMin: 6.99,
        priceMax: 37.99,
        priceCurrency: 'EUR',
      }
    }
  }

  return NextResponse.json(schema)
}

// PATCH /api/admin/seo/schema
export async function PATCH(req: Request) {
  const permission = await verifyPermission('seo', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const data = await req.json()
  const { id, ...updateData } = data

  const targetId = id || 'main'

  // Parse numeric values
  if (updateData.ratingValue !== undefined) {
    updateData.ratingValue = parseFloat(updateData.ratingValue) || 4.8
  }
  if (updateData.reviewCount !== undefined) {
    updateData.reviewCount = parseInt(updateData.reviewCount, 10) || 15000
  }
  if (updateData.priceMin !== undefined) {
    updateData.priceMin = parseFloat(updateData.priceMin) || 6.99
  }
  if (updateData.priceMax !== undefined) {
    updateData.priceMax = parseFloat(updateData.priceMax) || 39.99
  }

  const result = await db.schemaConfig.upsert({
    where: { id: targetId },
    update: updateData,
    create: { id: targetId, ...updateData },
  })

  return NextResponse.json({ ok: true, data: result })
}

