import { NextResponse } from 'next/server'
import { verifyApiAuth } from '@/lib/api-auth'

const CATEGORIES = [
  { id: 'guias', label: { es: 'Guías', fr: 'Guides', en: 'Guides', zh: '指南' }, description: 'Instalación, configuración y trucos' },
  { id: 'dispositivos', label: { es: 'Dispositivos', fr: 'Appareils', en: 'Devices', zh: '设备' }, description: 'Smart TV, Firestick, Android Box' },
  { id: 'contenido', label: { es: 'Contenido', fr: 'Contenu', en: 'Content', zh: '内容' }, description: 'Deportes, series, listas de canales' },
  { id: 'comparativas', label: { es: 'Comparativas', fr: 'Comparatifs', en: 'Comparisons', zh: '对比' }, description: 'Comparativa de servicios y apps IPTV' },
]

export async function GET(req: Request) {
  const auth = await verifyApiAuth(req)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  return NextResponse.json({
    ok: true,
    categories: CATEGORIES
  })
}
