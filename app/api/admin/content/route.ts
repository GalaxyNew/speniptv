import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPermission } from '@/lib/permissions'

// PATCH /api/admin/content — save one content field
export async function PATCH(req: Request) {
  const permission = await verifyPermission('content', 'edit')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { moduleId, locale, key, value } = await req.json()
  if (!moduleId || !locale || !key || value === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Ensure PageModule exists to avoid foreign key violations
  await db.pageModule.upsert({
    where: { id: moduleId },
    update: {},
    create: { id: moduleId },
  })

  const result = await db.moduleContent.upsert({
    where: { moduleId_locale_key: { moduleId, locale, key } },
    update: { value },
    create: { moduleId, locale, key, value },
  })

  return NextResponse.json({ ok: true, data: result })
}

// GET /api/admin/content?moduleId=hero&locale=fr
export async function GET(req: Request) {
  const permission = await verifyPermission('content', 'readonly')
  if (!permission.authorized) return NextResponse.json({ error: permission.error }, { status: permission.status })

  const { searchParams } = new URL(req.url)
  const moduleId = searchParams.get('moduleId')
  const locale = searchParams.get('locale')

  if (moduleId === 'support_popup' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'support_popup', locale }
    })
    if (existing.length === 0) {
      const t: Record<string, { agent_name: string; desc: string; button_text: string }> = {
        fr: {
          agent_name: 'Service Client',
          desc: 'Bonjour ! 👋 Comment pouvons-nous vous aider ? Obtenez votre abonnement IPTV en quelques minutes.',
          button_text: 'Discuter sur WhatsApp',
        },
        es: {
          agent_name: 'Atención al Cliente',
          desc: '¡Hola! 👋 ¿Cómo podemos ayudarte? Obtén tu suscripción IPTV en pocos minutos.',
          button_text: 'Chatear por WhatsApp',
        },
        en: {
          agent_name: 'Customer Support',
          desc: 'Hello! 👋 How can we help you today? Get your IPTV subscription in minutes.',
          button_text: 'Chat on WhatsApp',
        },
        zh: {
          agent_name: '在线客服',
          desc: '您好！👋 请问有什么可以帮您的？只需几分钟即可开通您的 IPTV 订阅。',
          button_text: '通过 WhatsApp 咨询',
        },
      }
      const L = t[locale] || t.en

      await db.pageModule.upsert({
        where: { id: 'support_popup' },
        update: {},
        create: { id: 'support_popup' },
      })

      await db.moduleContent.createMany({
        data: [
          { moduleId: 'support_popup', locale, key: 'agent_name', value: L.agent_name },
          { moduleId: 'support_popup', locale, key: 'desc', value: L.desc },
          { moduleId: 'support_popup', locale, key: 'button_text', value: L.button_text },
        ]
      })
    }
  }

  if (moduleId === 'trial_cta' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'trial_cta', locale }
    })
    if (existing.length === 0) {
      const defaults: Record<string, { title: string; subtitle: string; btn_text: string }> = {
        fr: {
          title: 'À quoi ressemble notre service',
          subtitle: "Plongez dans l'avenir de la télévision avec notre service IPTV avancé. S'abonner à l'IPTV n'a jamais été aussi simple : accédez à des chaînes de sport VIP du monde entier. Profitez de chaînes illimitées, d'événements PPV et de séries TV avec vos proches.",
          btn_text: 'Essai Gratuit',
        },
        es: {
          title: 'Cómo luce nuestro servicio',
          subtitle: 'Sumérgete en el futuro de la televisión con nuestro avanzado servicio IPTV España. Comprar IPTV en España nunca ha sido tan fácil: suscríbete y accede a canales deportivos VIP de todo el mundo. Disfruta de canales ilimitados, eventos PPV y series de televisión en compañía de tus seres queridos.',
          btn_text: 'Prueba Gratis',
        },
        en: {
          title: 'What our service looks like',
          subtitle: 'Immerse yourself in the future of television with our advanced IPTV service. Buying IPTV has never been easier: subscribe and access VIP sports channels from all over the world. Enjoy unlimited channels, PPV events, and TV series with your loved ones.',
          btn_text: 'Free Trial',
        },
        zh: {
          title: '我们的服务效果如何',
          subtitle: '使用我们先进的 IPTV 服务，沉浸在电视的未来中。购买 IPTV 从未如此简单：订阅并访问来自世界各地的 VIP 体育频道。与您爱的人一起享受无限频道、PPV 活动和电视连续剧。',
          btn_text: '免费试用',
        },
      }
      const L = defaults[locale] || defaults.en

      await db.pageModule.upsert({
        where: { id: 'trial_cta' },
        update: {},
        create: { id: 'trial_cta' },
      })

      await db.moduleContent.createMany({
        data: [
          { moduleId: 'trial_cta', locale, key: 'title', value: L.title },
          { moduleId: 'trial_cta', locale, key: 'subtitle', value: L.subtitle },
          { moduleId: 'trial_cta', locale, key: 'btn_text', value: L.btn_text },
        ]
      })
    }
  }

  if (moduleId === 'plans_cta' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'plans_cta', locale }
    })
    if (existing.length === 0) {
      const defaults: Record<string, { title: string; subtitle: string; btn_text: string }> = {
        fr: {
          title: 'Profitez des dernières sorties de films et séries',
          subtitle: 'Nous proposons une large sélection de films et de séries en haute qualité. Plus de 120 000 titres à portée de clic !',
          btn_text: 'Nos Tarifs',
        },
        es: {
          title: 'Disfruta de los últimos estrenos de películas y series',
          subtitle: 'Ofrecemos una amplia variedad de películas y series en alta calidad. ¡Más de 120,000 títulos estarán a tu disposición a solo un clic de distancia!',
          btn_text: 'Planes De Precios',
        },
        en: {
          title: 'Enjoy the latest movie and series releases',
          subtitle: 'We offer a wide variety of movies and series in high quality. More than 120,000 titles at your disposal just a click away!',
          btn_text: 'Pricing Plans',
        },
        zh: {
          title: '享受最新的电影和电视剧',
          subtitle: '我们提供高质量的丰富电影和电视剧。只需点击一下，即可为您提供超过 120,000 部作品！',
          btn_text: '价格套餐',
        },
      }
      const L = defaults[locale] || defaults.en

      await db.pageModule.upsert({
        where: { id: 'plans_cta' },
        update: {},
        create: { id: 'plans_cta' },
      })

      await db.moduleContent.createMany({
        data: [
          { moduleId: 'plans_cta', locale, key: 'title', value: L.title },
          { moduleId: 'plans_cta', locale, key: 'subtitle', value: L.subtitle },
          { moduleId: 'plans_cta', locale, key: 'btn_text', value: L.btn_text },
        ]
      })
    }
  }

  if (moduleId === 'header' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'header', locale }
    })
    if (existing.length === 0) {
      const defaults: Record<string, { brand_name: string; nav_link_1: string; nav_link_2: string; nav_link_3: string; nav_link_4: string; nav_link_5: string; nav_link_6: string; cta_text: string }> = {
        fr: {
          brand_name: 'IPTV Pro',
          nav_link_1: JSON.stringify({ text: 'Fonctionnalités', actionType: 'anchor', actionTarget: 'features', href: '#features' }),
          nav_link_2: JSON.stringify({ text: 'Tarifs', actionType: 'anchor', actionTarget: 'pricing', href: '#pricing' }),
          nav_link_3: JSON.stringify({ text: 'FAQ', actionType: 'anchor', actionTarget: 'faq', href: '#faq' }),
          nav_link_4: '',
          nav_link_5: '',
          nav_link_6: '',
          cta_text: JSON.stringify({ text: 'Essai Gratuit', actionType: 'anchor', actionTarget: 'trial_cta', href: '#trial_cta' }),
        },
        es: {
          brand_name: 'IPTV Pro',
          nav_link_1: JSON.stringify({ text: 'Inicio', actionType: 'anchor', actionTarget: 'hero', href: '#hero' }),
          nav_link_2: JSON.stringify({ text: 'Precio', actionType: 'anchor', actionTarget: 'pricing', href: '#pricing' }),
          nav_link_3: JSON.stringify({ text: 'FAQ', actionType: 'anchor', actionTarget: 'faq', href: '#faq' }),
          nav_link_4: '',
          nav_link_5: '',
          nav_link_6: '',
          cta_text: JSON.stringify({ text: 'Prueba', actionType: 'anchor', actionTarget: 'trial_cta', href: '#trial_cta' }),
        },
        en: {
          brand_name: 'IPTV Pro',
          nav_link_1: JSON.stringify({ text: 'Features', actionType: 'anchor', actionTarget: 'features', href: '#features' }),
          nav_link_2: JSON.stringify({ text: 'Pricing', actionType: 'anchor', actionTarget: 'pricing', href: '#pricing' }),
          nav_link_3: JSON.stringify({ text: 'FAQ', actionType: 'anchor', actionTarget: 'faq', href: '#faq' }),
          nav_link_4: '',
          nav_link_5: '',
          nav_link_6: '',
          cta_text: JSON.stringify({ text: 'Free Trial', actionType: 'anchor', actionTarget: 'trial_cta', href: '#trial_cta' }),
        },
        zh: {
          brand_name: '查理资讯',
          nav_link_1: JSON.stringify({ text: '产品特性', actionType: 'anchor', actionTarget: 'features', href: '#features' }),
          nav_link_2: JSON.stringify({ text: '价格套餐', actionType: 'anchor', actionTarget: 'pricing', href: '#pricing' }),
          nav_link_3: JSON.stringify({ text: '常见问题', actionType: 'anchor', actionTarget: 'faq', href: '#faq' }),
          nav_link_4: '',
          nav_link_5: '',
          nav_link_6: '',
          cta_text: JSON.stringify({ text: '免费试用', actionType: 'anchor', actionTarget: 'trial_cta', href: '#trial_cta' }),
        },
      }
      const L = defaults[locale] || defaults.en

      await db.pageModule.upsert({
        where: { id: 'header' },
        update: {},
        create: { id: 'header' },
      })

      await db.moduleContent.createMany({
        data: [
          { moduleId: 'header', locale, key: 'brand_name', value: L.brand_name },
          { moduleId: 'header', locale, key: 'nav_link_1', value: L.nav_link_1 },
          { moduleId: 'header', locale, key: 'nav_link_2', value: L.nav_link_2 },
          { moduleId: 'header', locale, key: 'nav_link_3', value: L.nav_link_3 },
          { moduleId: 'header', locale, key: 'nav_link_4', value: L.nav_link_4 },
          { moduleId: 'header', locale, key: 'nav_link_5', value: L.nav_link_5 },
          { moduleId: 'header', locale, key: 'nav_link_6', value: L.nav_link_6 },
          { moduleId: 'header', locale, key: 'cta_text', value: L.cta_text },
        ]
      })
    }
  }

  if (moduleId === 'footer' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'footer', locale }
    })
    if (existing.length === 0) {
      const defaults: Record<string, { copyright: string; description: string; footer_link_1: string; footer_link_2: string; footer_link_3: string; footer_link_4: string }> = {
        fr: {
          copyright: '© 2026 IPTV Pro. All Rights Reserved. 版权所有 • 卡密自助提取',
          description: 'Abonnement IPTV premium avec plus de 26 000 chaînes HD et 4K.',
          footer_link_1: JSON.stringify({ text: 'Mentions Légales', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_2: JSON.stringify({ text: 'Politique de Confidentialité', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_3: '',
          footer_link_4: '',
        },
        es: {
          copyright: '© 2026 IPTV Pro. All Rights Reserved. 版权所有 • 卡密自助提取',
          description: 'Suscripción IPTV premium con más de 26,000 canales HD y 4K.',
          footer_link_1: JSON.stringify({ text: 'Aviso Legal', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_2: JSON.stringify({ text: 'Política de Privacidad', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_3: '',
          footer_link_4: '',
        },
        en: {
          copyright: '© 2026 IPTV Pro. All Rights Reserved. 版权所有 • 卡密自助提取',
          description: 'Premium IPTV subscription with 26,000+ HD and 4K channels.',
          footer_link_1: JSON.stringify({ text: 'Terms of Service', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_2: JSON.stringify({ text: 'Privacy Policy', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_3: '',
          footer_link_4: '',
        },
        zh: {
          copyright: '© 2026 查理资讯. All Rights Reserved. 版权所有 • 卡密自助提取',
          description: '精品 IPTV 订阅服务，提供超过 26,000 个高清及 4K 频道。',
          footer_link_1: JSON.stringify({ text: '免责声明', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_2: JSON.stringify({ text: '隐私政策', actionType: 'url', actionTarget: '#', href: '#' }),
          footer_link_3: '',
          footer_link_4: '',
        },
      }
      const L = defaults[locale] || defaults.en

      await db.pageModule.upsert({
        where: { id: 'footer' },
        update: {},
        create: { id: 'footer' },
      })

      await db.moduleContent.createMany({
        data: [
          { moduleId: 'footer', locale, key: 'copyright', value: L.copyright },
          { moduleId: 'footer', locale, key: 'description', value: L.description },
          { moduleId: 'footer', locale, key: 'footer_link_1', value: L.footer_link_1 },
          { moduleId: 'footer', locale, key: 'footer_link_2', value: L.footer_link_2 },
          { moduleId: 'footer', locale, key: 'footer_link_3', value: L.footer_link_3 },
          { moduleId: 'footer', locale, key: 'footer_link_4', value: L.footer_link_4 },
        ]
      })
    }
  }

  if (moduleId === 'pricing' && locale) {
    const existing = await db.moduleContent.findMany({
      where: { moduleId: 'pricing', locale }
    })
    const hasPromo = existing.some(e => e.key === 'promo_text')
    const hasDisclaimer = existing.some(e => e.key === 'disclaimer')
    
    const promoDefaults: Record<string, string> = {
      zh: '限时专享 3 折会员试用 + 模型限时优惠 | Omni 图片低至免费，视频 3.0 全系 8 折起',
      fr: 'Offre Limitée : Essai 30% + Promo Spéciale | Images Omni gratuites, Vidéos 3.0 à -20%',
      es: 'Oferta Limitada: Prueba 30% + Descuento Especial | Imágenes Omni gratis, Videos 3.0 a -20%',
      en: 'Limited Time: 30% Trial + Special Discount | Omni Images free, Video 3.0 all at 20% off',
    }
    const disclaimerDefaults: Record<string, string> = {
      zh: '① 开启特惠试用后，将立即获得相应包特权，到期后将按照各计划费率自动续费。',
      fr: '① Subscriptions automatically renew after the selected package duration ends unless cancelled.',
      es: '① Subscriptions automatically renew after the selected package duration ends unless cancelled.',
      en: '① Subscriptions automatically renew after the selected package duration ends unless cancelled.',
    }

    await db.pageModule.upsert({
      where: { id: 'pricing' },
      update: {},
      create: { id: 'pricing' },
    })

    if (!hasPromo) {
      await db.moduleContent.create({
        data: {
          moduleId: 'pricing',
          locale,
          key: 'promo_text',
          value: promoDefaults[locale] || promoDefaults.en
        }
      })
    }

    if (!hasDisclaimer) {
      await db.moduleContent.create({
        data: {
          moduleId: 'pricing',
          locale,
          key: 'disclaimer',
          value: disclaimerDefaults[locale] || disclaimerDefaults.en
        }
      })
    }
  }

  // Auto-populate missing badges for specific modules
  const badgeDefaults: Record<string, Record<string, string>> = {
    hero: {
      fr: '🔥 Offre Spéciale',
      es: '🔥 Oferta Especial',
      en: '🔥 Special Offer',
      zh: '🔥 特别优惠',
    },
    authority: {
      fr: '📊 Garantie',
      es: '📊 Garantía',
      en: '📊 Trust',
      zh: '📊 服务保证',
    },
    pricing: {
      fr: 'Nos Offres',
      es: 'Nuestras Ofertas',
      en: 'Our Plans',
      zh: '特惠套餐',
    },
    features: {
      fr: 'Fonctionnalités',
      es: 'Caractéristiques',
      en: 'Features',
      zh: '产品特性',
    },
    how_it_works: {
      fr: 'ℹ️ Comment ça marche',
      es: 'ℹ️ Cómo Funciona',
      en: 'ℹ️ How It Works',
      zh: 'ℹ️ 工作流程',
    },
    nos_services: {
      fr: 'Nos Services',
      es: 'Nuestros Servicios',
      en: 'Our Services',
      zh: '我们的服务',
    },
    content: {
      fr: 'Chaînes & VOD',
      es: 'Canales y VOD',
      en: 'Channels & VOD',
      zh: '频道与点播',
    },
    sports_marquee: {
      fr: '⚽ Sports',
      es: '⚽ Deportes',
      en: '⚽ Sports',
      zh: '⚽ 体育直播',
    },
    movies_marquee: {
      fr: '🎬 Films',
      es: '🎬 Películas',
      en: '🎬 Movies',
      zh: '🎬 热门电影',
    },
    series_marquee: {
      fr: '📺 Séries',
      es: '📺 Series',
      en: '📺 Series',
      zh: '📺 热门剧集',
    },
    devices: {
      fr: 'Appareils',
      es: 'Dispositivos',
      en: 'Devices',
      zh: '支持设备',
    },
    testimonials: {
      fr: 'Avis Clients',
      es: 'Opiniones',
      en: 'Reviews',
      zh: '客户评价',
    },
    temoignages: {
      fr: 'Témoignages',
      es: 'Testimonios',
      en: 'Testimonials',
      zh: '真实口碑',
    },
    faq: {
      fr: 'FAQ',
      es: 'FAQ',
      en: 'FAQ',
      zh: '常见问题',
    },
    trial_cta: {
      fr: '🎁 Essai',
      es: '🎁 Prueba',
      en: '🎁 Trial',
      zh: '🎁 免费试用',
    },
    plans_cta: {
      fr: '💰 Tarifs',
      es: '💰 Precios',
      en: '💰 Pricing',
      zh: '💰 价格方案',
    },
    affiliate_links: {
      fr: '🔗 Liens Partenaires',
      es: '🔗 Enlaces de Socios',
      en: '🔗 Partner Links',
      zh: '🔗 推广伙伴',
    },
  }

  if (moduleId && locale && badgeDefaults[moduleId]) {
    const hasBadge = await db.moduleContent.findUnique({
      where: {
        moduleId_locale_key: {
          moduleId,
          locale,
          key: 'badge'
        }
      }
    })
    if (!hasBadge) {
      const defaultValue = badgeDefaults[moduleId][locale] || badgeDefaults[moduleId].en
      await db.pageModule.upsert({
        where: { id: moduleId },
        update: {},
        create: { id: moduleId },
      })
      await db.moduleContent.create({
        data: {
          moduleId,
          locale,
          key: 'badge',
          value: defaultValue,
        }
      })
    }
  }

  const contents = await db.moduleContent.findMany({
    where: {
      ...(moduleId ? { moduleId } : {}),
      ...(locale ? { locale } : {}),
    },
    orderBy: [{ moduleId: 'asc' }, { locale: 'asc' }, { key: 'asc' }],
  })

  return NextResponse.json(contents)
}
