import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

// GET all tiers with plans and labels
export async function GET() {
  const permission = await verifyPermission('pricing', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const [tiers, pricingSettings] = await Promise.all([
    db.pricingTier.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        labels: true,
        plans: {
          orderBy: { sortOrder: 'asc' },
          include: { labels: true },
        },
      },
    }),
    db.moduleContent.findMany({
      where: { moduleId: 'pricing', locale: 'es' }
    })
  ])

  const settingsObj = Object.fromEntries(pricingSettings.map(s => [s.key, s.value]))

  return NextResponse.json({
    tiers,
    settings: {
      display_devices: settingsObj.display_devices ?? '1,2,3',
      display_months: settingsObj.display_months ?? '1,3,6,12',
    }
  })
}

// PATCH update a plan field or plan label field
export async function PATCH(req: Request) {
  const permission = await verifyPermission('pricing', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const body = await req.json()

  // Update pricing settings (display_devices, display_months)
  if (body.settingKey && body.value !== undefined) {
    const allowed = ['display_devices', 'display_months']
    if (!allowed.includes(body.settingKey)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 })
    }
    const locales = ['es']
    await Promise.all(
      locales.map(loc => 
        db.moduleContent.upsert({
          where: { moduleId_locale_key: { moduleId: 'pricing', locale: loc, key: body.settingKey } },
          create: { moduleId: 'pricing', locale: loc, key: body.settingKey, value: body.value },
          update: { value: body.value }
        })
      )
    )
    return NextResponse.json({ ok: true })
  }

  // Update PricingPlan (sortOrder)
  if (body.planId && body.field) {
    const allowed = ['sortOrder']
    if (!allowed.includes(body.field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }
    const result = await db.pricingPlan.update({
      where: { id: body.planId },
      data: { [body.field]: body.value },
    })
    return NextResponse.json({ ok: true, data: result })
  }

  // Update PlanLabel (duration, ctaText, subText, features, waMessage, price, originalPrice, isRecommended, currencySymbol)
  if (body.planLabelId && body.field) {
    const allowed = ['duration', 'ctaText', 'subText', 'features', 'waMessage', 'price', 'originalPrice', 'isRecommended', 'currencySymbol']
    if (!allowed.includes(body.field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }
    const result = await db.planLabel.update({
      where: { id: body.planLabelId },
      data: { [body.field]: body.value },
    })
    return NextResponse.json({ ok: true, data: result })
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
}
