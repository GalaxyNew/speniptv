import bcrypt from 'bcryptjs'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter } as any)

const locales = ['es'] as const

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin account ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123admin', 12)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: { username: 'admin', password: hashedPassword },
  })
  console.log('✅ Admin created (username: admin, password: admin123admin)')

  // ── Site Settings ─────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      brandName: 'IPTV Pro',
      brandLogoUrl: '',
      siteDomain: 'https://igoriptv2.com',
      activeTheme: 'dark-tech',
      activeFont: 'Outfit',
      whatsappNumber: '33612345678',
      whatsappMsg_fr: "Bonjour, je souhaite m'abonner à IPTV Pro.",
      whatsappMsg_es: 'Hola, quiero suscribirme a IPTV Pro.',
      whatsappMsg_en: 'Hello, I want to subscribe to IPTV Pro.',
      defaultLocale: 'es',
    },
  })
  console.log('✅ Site settings created')

  // ── Schema.org Config ─────────────────────────────────────
  await prisma.schemaConfig.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      orgName: 'IPTV Pro',
      orgUrl: 'https://igoriptv2.com',
      ratingValue: 4.8,
      reviewCount: 15000,
      priceMin: 6.99,
      priceMax: 39.99,
      priceCurrency: 'EUR',
    },
  })

  // ── Page SEO ─────────────────────────────────────────────
  const seoData = {
    fr: {
      metaTitle: 'IPTV Pro - Abonnement IPTV Premium | 26 000+ Chaînes HD/4K',
      metaDescription: 'Accédez à plus de 26 000 chaînes HD et 4K avec IPTV Pro. Films, séries, sport en direct. Essai gratuit 24h. Livraison instantanée.',
    },
    es: {
      metaTitle: 'IPTV Pro - Suscripción IPTV Premium | 26,000+ Canales HD/4K',
      metaDescription: 'Accede a más de 26,000 canales HD y 4K con IPTV Pro. Películas, series, deportes en vivo. Prueba gratuita 24h. Entrega instantánea.',
    },
    en: {
      metaTitle: 'IPTV Pro - Premium IPTV Subscription | 26,000+ HD/4K Channels',
      metaDescription: 'Access 26,000+ HD and 4K channels with IPTV Pro. Movies, series, live sports. Free 24h trial. Instant delivery.',
    },
  }
  for (const locale of locales) {
    const d = seoData[locale]
    await prisma.pageSeo.upsert({
      where: { locale },
      update: {},
      create: { locale, metaTitle: d.metaTitle, metaDescription: d.metaDescription },
    })
  }

  // ── Page Modules ──────────────────────────────────────────
  const modules = [
    { id: 'hero',             sortOrder: 1 },
    { id: 'authority',        sortOrder: 2 },
    { id: 'pricing',          sortOrder: 3 },
    { id: 'features',         sortOrder: 4 },
    { id: 'how_it_works',     sortOrder: 5 },
    { id: 'content',          sortOrder: 6 },
    { id: 'sports_marquee',   sortOrder: 7 },
    { id: 'movies_marquee',   sortOrder: 8 },
    { id: 'series_marquee',   sortOrder: 9 },
    { id: 'devices',          sortOrder: 10 },
    { id: 'testimonials',     sortOrder: 11 },
    { id: 'faq',              sortOrder: 12 },
    { id: 'affiliate_links',  sortOrder: 13 },
  ]

  for (const mod of modules) {
    await prisma.pageModule.upsert({
      where: { id: mod.id },
      update: {
        sortOrder: mod.sortOrder,
      },
      create: {
        id: mod.id,
        isVisible: true,
        isVisible_fr: true,
        isVisible_es: true,
        isVisible_en: true,
        isVisible_zh: true,
        sortOrder: mod.sortOrder,
        sortOrder_fr: mod.sortOrder,
        sortOrder_es: mod.sortOrder,
        sortOrder_en: mod.sortOrder,
        sortOrder_zh: mod.sortOrder,
      },
    })
  }

  // ── Module Content: Hero ──────────────────────────────────
  const heroContent: Record<string, Record<string, string>> = {
    fr: {
      badge: '🔥 +26 000 Chaînes HD & 4K',
      h1: "L'Abonnement IPTV Premium\nN°1 en Europe",
      subtitle: 'Films, séries, sport, chaînes internationales — tout en un. Sans engagement, sans coupure.',
      cta_primary: 'Commencer maintenant',
      cta_secondary: 'Voir les offres',
      stat_channels: '26 000+',
      stat_channels_label: 'Chaînes disponibles',
      stat_quality: '4K',
      stat_quality_label: 'Ultra HD',
      stat_uptime: '99.9%',
      stat_uptime_label: 'Disponibilité',
      stat_trial: '24h',
      stat_trial_label: 'Essai gratuit',
    },
    es: {
      badge: '🔥 +26 000 Canales HD y 4K',
      h1: "La Suscripción IPTV Premium\nN°1 en Europa",
      subtitle: 'Películas, series, deportes, canales internacionales — todo en uno. Sin compromiso, sin interrupciones.',
      cta_primary: 'Empezar ahora',
      cta_secondary: 'Ver ofertas',
      stat_channels: '26 000+',
      stat_channels_label: 'Canales disponibles',
      stat_quality: '4K',
      stat_quality_label: 'Ultra HD',
      stat_uptime: '99.9%',
      stat_uptime_label: 'Disponibilidad',
      stat_trial: '24h',
      stat_trial_label: 'Prueba gratuita',
    },
    en: {
      badge: '🔥 26,000+ HD & 4K Channels',
      h1: "Europe's #1 Premium\nIPTV Subscription",
      subtitle: 'Movies, series, sports, international channels — all in one place. No commitment, no buffering.',
      cta_primary: 'Get Started Now',
      cta_secondary: 'View Plans',
      stat_channels: '26,000+',
      stat_channels_label: 'Available Channels',
      stat_quality: '4K',
      stat_quality_label: 'Ultra HD',
      stat_uptime: '99.9%',
      stat_uptime_label: 'Uptime',
      stat_trial: '24h',
      stat_trial_label: 'Free Trial',
    },
  }

  // ── Module Content: Features ──────────────────────────────
  const featuresContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'Fonctionnalités',
      title: 'Tout ce dont vous avez besoin',
      subtitle: 'Une expérience streaming complète, sans compromis',
      f1_title: 'Qualité 4K Ultra HD',
      f1_desc: "Profitez d'une image cristalline sur tous vos écrans",
      f2_title: 'Anti-Coupure Avancé',
      f2_desc: 'Technologie de buffering intelligente pour un visionnage fluide',
      f3_title: 'Multi-Écrans',
      f3_desc: "Regardez sur jusqu'à 4 appareils simultanément",
      f4_title: 'VOD Illimitée',
      f4_desc: '+80 000 films et séries disponibles à la demande',
      f5_title: 'Sport en Direct',
      f5_desc: 'Tous les grands événements sportifs en temps réel',
      f6_title: 'Support 24/7',
      f6_desc: 'Notre équipe est disponible à toute heure pour vous aider',
    },
    es: {
      badge: 'Características',
      title: 'Todo lo que necesitas',
      subtitle: 'Una experiencia de streaming completa, sin compromisos',
      f1_title: 'Calidad 4K Ultra HD',
      f1_desc: 'Disfruta de una imagen cristalina en todas tus pantallas',
      f2_title: 'Anti-Corte Avanzado',
      f2_desc: 'Tecnología de buffering inteligente para una visión fluida',
      f3_title: 'Multi-Pantalla',
      f3_desc: 'Ve en hasta 4 dispositivos simultáneamente',
      f4_title: 'VOD Ilimitado',
      f4_desc: '+80,000 películas y series disponibles bajo demanda',
      f5_title: 'Deportes en Directo',
      f5_desc: 'Todos los grandes eventos deportivos en tiempo real',
      f6_title: 'Soporte 24/7',
      f6_desc: 'Nuestro equipo está disponible a cualquier hora',
    },
    en: {
      badge: 'Features',
      title: 'Everything you need',
      subtitle: 'A complete streaming experience, no compromises',
      f1_title: '4K Ultra HD Quality',
      f1_desc: 'Enjoy crystal-clear picture on all your screens',
      f2_title: 'Advanced Anti-Buffering',
      f2_desc: 'Smart buffering technology for smooth, uninterrupted viewing',
      f3_title: 'Multi-Screen',
      f3_desc: 'Watch on up to 4 devices simultaneously',
      f4_title: 'Unlimited VOD',
      f4_desc: '80,000+ movies and series available on demand',
      f5_title: 'Live Sports',
      f5_desc: 'All major sporting events in real time',
      f6_title: '24/7 Support',
      f6_desc: 'Our team is available around the clock to help you',
    },
  }

  // ── Module Content: FAQ ───────────────────────────────────
  const faqContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'FAQ',
      title: 'Questions fréquentes',
      q1: "Qu'est-ce qu'un abonnement IPTV ?",
      a1: "Un abonnement IPTV vous permet de regarder des chaînes de télévision, des films et des séries via Internet, sans câble ni satellite.",
      q2: 'Quels appareils sont compatibles ?',
      a2: 'Smart TV, Android TV, Firestick, Apple TV, PC, Mac, iPhone, Android — tous les appareils modernes sont compatibles.',
      q3: 'Y a-t-il un engagement ?',
      a3: "Non ! Nos abonnements sont sans engagement. Choisissez la durée qui vous convient et renouvelez si vous êtes satisfait.",
      q4: 'Comment puis-je payer ?',
      a4: 'Nous acceptons PayPal, carte bancaire, et cryptomonnaies. Paiement 100% sécurisé.',
      q5: 'Puis-je essayer avant de payer ?',
      a5: "Oui ! Nous offrons un essai gratuit de 24h. Contactez-nous sur WhatsApp pour en bénéficier.",
    },
    es: {
      badge: 'FAQ',
      title: 'Preguntas frecuentes',
      q1: '¿Qué es una suscripción IPTV?',
      a1: 'Una suscripción IPTV te permite ver canales de TV, películas y series a través de Internet, sin cable ni satélite.',
      q2: '¿Qué dispositivos son compatibles?',
      a2: 'Smart TV, Android TV, Firestick, Apple TV, PC, Mac, iPhone, Android — todos los dispositivos modernos son compatibles.',
      q3: '¿Hay compromiso de permanencia?',
      a3: '¡No! Nuestras suscripciones son sin compromiso. Elige la duración que prefieras y renueva si estás satisfecho.',
      q4: '¿Cómo puedo pagar?',
      a4: 'Aceptamos PayPal, tarjeta bancaria y criptomonedas. Pago 100% seguro.',
      q5: '¿Puedo probar antes de pagar?',
      a5: '¡Sí! Ofrecemos una prueba gratuita de 24h. Contáctanos por WhatsApp para solicitarla.',
    },
    en: {
      badge: 'FAQ',
      title: 'Frequently Asked Questions',
      q1: 'What is an IPTV subscription?',
      a1: 'An IPTV subscription lets you watch TV channels, movies and series via the Internet, without cable or satellite.',
      q2: 'Which devices are compatible?',
      a2: 'Smart TV, Android TV, Firestick, Apple TV, PC, Mac, iPhone, Android — all modern devices are supported.',
      q3: 'Is there a commitment?',
      a3: 'No! Our subscriptions are commitment-free. Choose your preferred duration and renew if you are satisfied.',
      q4: 'How can I pay?',
      a4: 'We accept PayPal, bank card, and cryptocurrencies. 100% secure payment.',
      q5: 'Can I try before paying?',
      a5: 'Yes! We offer a free 24h trial. Contact us on WhatsApp to get yours.',
    },
  }

  const authorityContent: Record<string, Record<string, string>> = {
    fr: {
      badge_1: '✅ Paiement sécurisé',
      badge_2: '⚡ Activation instantanée',
      badge_3: '🔒 Sans engagement',
      badge_4: '🌍 Compatible partout',
      s1_val: '26 000+',
      s1_lbl: 'Chaînes disponibles',
      s2_val: '80 000+',
      s2_lbl: 'Films & Séries VOD',
      s3_val: '15 000+',
      s3_lbl: 'Clients satisfaits',
      s4_val: '99.9%',
      s4_lbl: 'Temps de disponibilité',
    },
    es: {
      badge_1: '✅ Pago seguro',
      badge_2: '⚡ Activación instantánea',
      badge_3: '🔒 Sin compromiso',
      badge_4: '🌍 Compatible en todo el mundo',
      s1_val: '26 000+',
      s1_lbl: 'Canales disponibles',
      s2_val: '80 000+',
      s2_lbl: 'Películas y Series VOD',
      s3_val: '15 000+',
      s3_lbl: 'Clientes satisfechos',
      s4_val: '99.9%',
      s4_lbl: 'Disponibilidad',
    },
    en: {
      badge_1: '✅ Secure payment',
      badge_2: '⚡ Instant activation',
      badge_3: '🔒 No commitment',
      badge_4: '🌍 Works everywhere',
      s1_val: '26,000+',
      s1_lbl: 'Available Channels',
      s2_val: '80,000+',
      s2_lbl: 'VOD Movies & Series',
      s3_val: '15,000+',
      s3_lbl: 'Happy Customers',
      s4_val: '99.9%',
      s4_lbl: 'Uptime',
    },
  }

  const pricingTitleContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'Nos Offres',
      title: 'Choisissez votre abonnement',
      subtitle: 'Sans engagement · Livraison instantanée · Support 24/7',
    },
    es: {
      badge: 'Nuestras Ofertas',
      title: 'Elige tu suscripción',
      subtitle: 'Sin compromiso · Entrega instantánea · Soporte 24/7',
    },
    en: {
      badge: 'Our Plans',
      title: 'Choose your subscription',
      subtitle: 'No commitment · Instant delivery · 24/7 Support',
    },
  }

  const contentShowcaseContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'Contenu',
      title: 'Des milliers de chaînes en direct & VOD',
      subtitle: 'Le meilleur de la télévision internationale, du sport et du cinéma.',
      t1_name: '⚽ Sport en Direct',
      t1_desc: 'Regardez la Ligue des Champions, Premier League, LaLiga, Serie A, Ligue 1, F1 et bien plus en HD et 4K.',
      t2_name: '🎬 Films & Séries VOD',
      t2_desc: 'Plus de 80 000 titres à la demande (Netflix, Prime, Disney+). Mises à jour quotidiennes en VF et VOST.',
      t3_name: '🌍 Chaînes Mondiales',
      t3_desc: 'Accédez aux chaînes françaises, belges, suisses, espagnoles, anglaises, arabes, américaines et africaines.',
      t4_name: '👶 Enfants & Famille',
      t4_desc: 'Dessins animés, documentaires de qualité, chaînes musicales et de divertissement pour tous.',
    },
    es: {
      badge: 'Contenido',
      title: 'Miles de canales en vivo y VOD',
      subtitle: 'Lo mejor de la televisión internacional, deportes y cine.',
      t1_name: '⚽ Deportes en Vivo',
      t1_desc: 'Mira la Champions League, Premier League, LaLiga, Serie A, F1 y mucho más en HD y 4K.',
      t2_name: '🎬 Películas y VOD',
      t2_desc: 'Más de 80,000 títulos bajo demanda (Netflix, Prime, Disney+). Actualizaciones diarias en castellano y VO.',
      t3_name: '🌍 Canales Mundiales',
      t3_desc: 'Accede a canales de España, Francia, Reino Unido, Estados Unidos, América Latina y países árabes.',
      t4_name: '👶 Niños y Familia',
      t4_desc: 'Dibujos animados, documentales de calidad, canales de música y entretenimiento para todos.',
    },
    en: {
      badge: 'Content',
      title: 'Thousands of Live Channels & VOD',
      subtitle: 'The best of international TV, live sports, movies, and series.',
      t1_name: '⚽ Live Sports',
      t1_desc: 'Watch Champions League, Premier League, LaLiga, Serie A, F1, and more in HD and 4K quality.',
      t2_name: '🎬 Movies & VOD',
      t2_desc: 'Over 80,000 on-demand titles (Netflix, Prime, Disney+). Daily updates in multiple audio tracks.',
      t3_name: '🌍 Global Channels',
      t3_desc: 'Get channels from UK, USA, France, Spain, Germany, Arab countries, Africa, and Asia.',
      t4_name: '👶 Kids & Family',
      t4_desc: 'Cartoons, high-quality documentaries, music channels, and entertainment for all ages.',
    },
  }

  const devicesContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'Compatibilité',
      title: 'Compatible avec tous vos appareils',
      subtitle: 'Regardez sur votre Smart TV, téléphone, tablette ou ordinateur — où que vous soyez.',
      dev1_lbl: 'Smart TV',
      dev2_lbl: 'Android',
      dev3_lbl: 'iPhone / iPad',
      dev4_lbl: 'PC / Mac',
      dev5_lbl: 'FireStick',
      dev6_lbl: 'Android Box',
      dev7_lbl: 'Apple TV',
      dev8_lbl: 'MAG Box',
    },
    es: {
      badge: 'Compatibilidad',
      title: 'Compatible con todos tus dispositivos',
      subtitle: 'Ve en tu Smart TV, teléfono, tableta u ordenador — donde quieras.',
      dev1_lbl: 'Smart TV',
      dev2_lbl: 'Android',
      dev3_lbl: 'iPhone / iPad',
      dev4_lbl: 'PC / Mac',
      dev5_lbl: 'FireStick',
      dev6_lbl: 'Android Box',
      dev7_lbl: 'Apple TV',
      dev8_lbl: 'MAG Box',
    },
    en: {
      badge: 'Compatibility',
      title: 'Works on all your devices',
      subtitle: 'Watch on your Smart TV, phone, tablet or computer — wherever you are.',
      dev1_lbl: 'Smart TV',
      dev2_lbl: 'Android',
      dev3_lbl: 'iPhone / iPad',
      dev4_lbl: 'PC / Mac',
      dev5_lbl: 'FireStick',
      dev6_lbl: 'Android Box',
      dev7_lbl: 'Apple TV',
      dev8_lbl: 'MAG Box',
    },
  }

  const testimonialsContent: Record<string, Record<string, string>> = {
    fr: {
      badge: 'Avis clients',
      title: 'Ce Que Disent Nos Clients',
      subtitle: 'Rejoignez 17.500+ clients satisfaits en France et en Belgique',
      rating_score: '4.9',
      rating_text: 'Excellent • Basé sur 17.500+ avis',
      r1_name: 'Thomas D.', r1_city: 'Paris', r1_country: '🇫🇷 France', r1_date: '12 février 2026', r1_title: 'Enfin tous les matchs de Ligue 1 au même endroit.', r1_text: "Plus besoin d'abonnements coûteux chez Canal+ ou DAZN. La qualité d'image est top, même en direct. Je recommande !", r1_image: '/images/reviews/1.webp',
      r2_name: 'Sophie M.', r2_city: 'Lyon', r2_country: '🇫🇷 France', r2_date: '5 février 2026', r2_title: 'Fonctionne parfaitement.', r2_text: "Toutes les chaînes françaises disponibles. Mon mari regarde le sport et moi mes séries. L'installation sur notre Samsung TV était super simple.", r2_image: '/images/reviews/2.webp',
      r3_name: 'Marc J.', r3_city: 'Marseille', r3_country: '🇫🇷 France', r3_date: '28 janvier 2026', r3_title: "J'étais sceptique, mais l'essai gratuit m'a convaincu.", r3_text: "La bibliothèque de films est énorme et propose toujours les dernières sorties. Le support répond aussi très vite via WhatsApp.", r3_image: '/images/reviews/3.webp',
      r4_name: 'Julie B.', r4_city: 'Nice', r4_country: '🇫🇷 France', r4_date: '22 janvier 2026', r4_title: 'Excellent rapport qualité-prix.', r4_text: "Pour moins de dix euros par mois, on regarde tout ce qu'on veut. Pas de coupures et une belle image 4K.", r4_image: '/images/reviews/4.webp',
      r5_name: 'Kevin S.', r5_city: 'Lille', r5_country: '🇫🇷 France', r5_date: '15 janvier 2026', r5_title: 'Idéal pour la Formule 1.', r5_text: "Plus besoin de Canal+ Sport. Les streams sont stables et le commentaire est en français. Service au top !", r5_image: '/images/reviews/5.webp',
      r6_name: 'Emma T.', r6_city: 'Toulouse', r6_country: '🇫🇷 France', r6_date: '8 janvier 2026', r6_title: 'Facile à utiliser dans la chambre et le salon.', r6_text: "Avec un seul abonnement, on regarde sur plusieurs écrans. Les enfants sont ravis avec les chaînes Disney.", r6_image: '/images/reviews/6.webp',
      r7_name: 'Antoine W.', r7_city: 'Strasbourg', r7_country: '🇫🇷 France', r7_date: '2 janvier 2026', r7_title: 'Service impeccable avec une grande variété de chaînes.', r7_text: "La qualité est toujours au rendez-vous et le support client est très réactif. Je recommande vivement !", r7_image: '/images/reviews/7.webp',
      r8_name: 'Sarah K.', r8_city: 'Bordeaux', r8_country: '🇫🇷 France', r8_date: '27 décembre 2025', r8_title: 'Très satisfaite de la stabilité.', r8_text: "Même aux heures de pointe, pas de mise en mémoire tampon. Le service client m'a bien aidée pour l'installation sur mon Fire Stick.", r8_image: '/images/reviews/8.webp',
    },
    es: {
      badge: 'Opiniones',
      title: 'Lo Que Dicen Nuestros Clientes',
      subtitle: 'Únase a más de 17.500 clientes satisfechos en España y Latinoamérica',
      rating_score: '4.9',
      rating_text: 'Excelente • Basado en más de 17.500 opiniones',
      r1_name: 'Tomás D.', r1_city: 'Madrid', r1_country: '🇪🇸 España', r1_date: '12 de febrero de 2026', r1_title: 'Por fin todos los partidos de LaLiga en un solo lugar.', r1_text: "Ya no necesito suscripciones caras de Movistar+ o DAZN. La calidad de imagen es excelente, incluso en vivo. ¡Lo recomiendo!", r1_image: '/images/reviews/1.webp',
      r2_name: 'Sofía M.', r2_city: 'Barcelona', r2_country: '🇪🇸 España', r2_date: '5 de febrero de 2026', r2_title: 'Funciona a la perfección.', r2_text: "Todos los canales de España disponibles. Mi marido ve los deportes y yo mis series. La instalación en nuestra Samsung TV fue superfácil.", r2_image: '/images/reviews/2.webp',
      r3_name: 'Marcos J.', r3_city: 'Valencia', r3_country: '🇪🇸 España', r3_date: '28 de enero de 2026', r3_title: 'Era escéptico, pero la prueba gratuita me convenció.', r3_text: "La biblioteca de películas es enorme y siempre tiene los últimos estrenos. El soporte también responde muy rápido por WhatsApp.", r3_image: '/images/reviews/3.webp',
      r4_name: 'Julia B.', r4_city: 'Sevilla', r4_country: '🇪🇸 España', r4_date: '22 de enero de 2026', r4_title: 'Excelente relación calidad-precio.', r4_text: "Por menos de diez euros al mes vemos todo lo que queremos. Sin cortes y con una hermosa imagen en 4K.", r4_image: '/images/reviews/4.webp',
      r5_name: 'Kevin S.', r5_city: 'Málaga', r5_country: '🇪🇸 España', r5_date: '15 de enero de 2026', r5_title: 'Ideal para la Fórmula 1 y MotoGP.', r5_text: "Ya no necesito costosos abonnements. Los streams son estables y con comentarios en español. ¡Servicio de primera!", r5_image: '/images/reviews/5.webp',
      r6_name: 'Emma T.', r6_city: 'Zaragoza', r6_country: '🇪🇸 España', r6_date: '8 de enero de 2026', r6_title: 'Fácil de usar en la habitación y el salón.', r6_text: "Con una sola suscripción vemos en múltiples pantallas. Los niños están encantados con los canales de Disney.", r6_image: '/images/reviews/6.webp',
      r7_name: 'Antonio W.', r7_city: 'Bilbao', r7_country: '🇪🇸 España', r7_date: '2 de enero de 2026', r7_title: 'Servicio impecable con una gran variedad de canales.', r7_text: "La calidad siempre está garantizada y el soporte al cliente es sumamente reactivo. ¡Lo recomiendo mucho!", r7_image: '/images/reviews/7.webp',
      r8_name: 'Sara K.', r8_city: 'Alicante', r8_country: '🇪🇸 España', r8_date: '27 de diciembre de 2025', r8_title: 'Muy satisfecha con la estabilidad.', r8_text: "Incluso en horas pico no hay almacenamiento en búfer. El servicio al cliente me ayudó mucho para instalarlo en mi Fire Stick.", r8_image: '/images/reviews/8.webp',
    },
    en: {
      badge: 'Reviews',
      title: 'What Our Customers Say',
      subtitle: 'Join 17,500+ satisfied customers globally',
      rating_score: '4.9',
      rating_text: 'Excellent • Based on 17,500+ reviews',
      r1_name: 'Thomas D.', r1_city: 'London', r1_country: '🇬🇧 UK', r1_date: 'February 12, 2026', r1_title: 'Finally all Premier League matches in one place.', r1_text: "No more expensive Sky or TNT subscriptions. The image quality is top, even live. Highly recommended!", r1_image: '/images/reviews/1.webp',
      r2_name: 'Sophie M.', r2_city: 'Manchester', r2_country: '🇬🇧 UK', r2_date: 'February 5, 2026', r2_title: 'Works absolutely perfectly.', r2_text: "All UK and US channels are available. My husband watches sports and I watch my series. Setup on our Samsung TV was super simple.", r2_image: '/images/reviews/2.webp',
      r3_name: 'Marc J.', r3_city: 'Dublin', r3_country: '🇮🇪 Ireland', r3_date: 'January 28, 2026', r3_title: 'I was skeptical, but the free trial convinced me.', r3_text: "The movie library is huge and always has the latest releases. Support is also very fast via WhatsApp.", r3_image: '/images/reviews/3.webp',
      r4_name: 'Julie B.', r4_city: 'New York', r4_country: '🇺🇸 US', r4_date: 'January 22, 2026', r4_title: 'Excellent value for money.', r4_text: "For less than ten euros a month, we watch whatever we want. No buffering and beautiful 4K quality.", r4_image: '/images/reviews/4.webp',
      r5_name: 'Kevin S.', r5_city: 'Boston', r5_country: '🇺🇸 US', r5_date: 'January 15, 2026', r5_title: 'Ideal for Formula 1 & sports.', r5_text: "No more need for separate sports channels. The streams are stable and in English. Top tier service!", r5_image: '/images/reviews/5.webp',
      r6_name: 'Emma T.', r6_city: 'Sydney', r6_country: '🇦🇺 Australia', r6_date: 'January 8, 2026', r6_title: 'Easy to use in the bedroom and living room.', r6_text: "With a single subscription we watch on multiple screens. The kids love the Disney channels.", r6_image: '/images/reviews/6.webp',
      r7_name: 'Antoine W.', r7_city: 'Toronto', r7_country: '🇨🇦 Canada', r7_date: 'January 2, 2026', r7_title: 'Impeccable service with a huge variety of channels.', r7_text: "The quality is always consistent and the support team is extremely responsive. Highly recommended!", r7_image: '/images/reviews/7.webp',
      r8_name: 'Sarah K.', r8_city: 'Vancouver', r8_country: '🇨🇦 Canada', r8_date: 'December 27, 2025', r8_title: 'Very satisfied with the stability.', r8_text: "Even at peak hours, there is no buffering. Customer support helped me set it up on my Fire Stick.", r8_image: '/images/reviews/8.webp',
    },
  }

  const sportsMarqueeContent: Record<string, Record<string, string>> = {
    fr: {
      title: 'STREAMEZ TOUS VOS SPORTS PRÉFÉRÉS',
      subtitle: 'Toutes les grandes compétitions et événements PPV en direct',
    },
    es: {
      title: 'TRANSMITE TODOS TUS DEPORTES FAVORITOS',
      subtitle: 'Todas las grandes competiciones y eventos PPV en vivo',
    },
    en: {
      title: 'STREAM ALL YOUR FAVORITE SPORTS',
      subtitle: 'All major competitions and PPV events live',
    },
  }

  const moviesMarqueeContent: Record<string, Record<string, string>> = {
    fr: {
      title: 'Films Blockbuster à la Demande',
      subtitle: 'Nouvelles sorties chaque jour. Streamez les derniers succès du cinéma en qualité 4K.',
    },
    es: {
      title: 'Películas Blockbuster a la Carta',
      subtitle: 'Nuevos estrenos cada día. Transmite los últimos éxitos del cine en calidad 4K.',
    },
    en: {
      title: 'Blockbuster Movies on Demand',
      subtitle: 'New releases every day. Stream the latest cinema hits in 4K quality.',
    },
  }

  const seriesMarqueeContent: Record<string, Record<string, string>> = {
    fr: {
      title: 'Séries TV Incontournables',
      subtitle: 'Saisons complètes de vos émissions préférées, des classiques aux nouveautés.',
    },
    es: {
      title: 'Series de TV Imprescindibles',
      subtitle: 'Temporadas completas de tus programas favoritos, desde clásicos hasta novedades.',
    },
    en: {
      title: 'Must-Watch TV Series',
      subtitle: 'Full seasons of your favorite shows, from classics to new releases.',
    },
  }

  const howItWorksContent: Record<string, Record<string, string>> = {
    fr: {
      title: 'Comment Ça IPTV Travaux ?',
      subtitle: 'Obtenir l\'IPTV est facile, suivez ces étapes.',
      step1_title: '1. Passez Votre Commande',
      step1_desc: 'Choisissez votre forfait IPTV préféré et passez votre commande',
      step1_icon: '/images/icons/step1.svg',
      step2_title: '2. Obtenez Votre Compte',
      step2_desc: 'Obtenez votre accès de connexion après paiement par e-mail ou WhatsApp',
      step2_icon: '/images/icons/step2.svg',
      step3_title: '3. Profitez De Votre Service IPTV !',
      step3_desc: 'Profitez de plus de 31 000 chaînes de télévision en direct et de plus de 120 000 films',
      step3_icon: '/images/icons/step3.svg',
      banner_title: 'TOUTES LES CHAÎNES SPORTIVES SUR DU BOUT DES DOIGTS!',
      banner_desc: "Préparez-vous à une expérience sportive supérieure grâce à notre service IPTV ! Regardez désormais toutes vos chaînes sportives préférées sans vous ruiner. Dites adieu aux frais supplémentaires et profitez d'un divertissement sportif sans fin !",
      banner_image: '/images/sports_collage.png',
      bg_image_url: '/images/sports_stadium_bg.webp',
    },
    es: {
      title: '¿Cómo funciona el IPTV?',
      subtitle: 'Obtener IPTV es fácil, siga estos pasos.',
      step1_title: '1. Realice su pedido',
      step1_desc: 'Elija su plan de IPTV preferido y complete su pedido',
      step1_icon: '/images/icons/step1.svg',
      step2_title: '2. Obtenga su cuenta',
      step2_desc: 'Obtenga sus credenciales de acceso después de pagar por correo o WhatsApp',
      step2_icon: '/images/icons/step2.svg',
      step3_title: '3. ¡Disfrute de su servicio IPTV!',
      step3_desc: 'Disfrute de más de 31,000 canales de televisión en vivo y más de 120,000 películas',
      step3_icon: '/images/icons/step3.svg',
      banner_title: '¡TODOS LOS CANALES DE DEPORTES AL ALCANCE DE TU MANO!',
      banner_desc: '¡Prepárese para una experiencia deportiva superior con nuestro servicio de IPTV! Vea todos sus canales de deportes favoritos sin gastar una fortuna. ¡Diga adiós a los cargos adicionales y disfrute de entretenimiento ilimitado!',
      banner_image: '/images/sports_collage.png',
      bg_image_url: '/images/sports_stadium_bg.webp',
    },
    en: {
      title: 'How Does IPTV Work?',
      subtitle: 'Getting IPTV is easy, follow these steps.',
      step1_title: '1. Place Your Order',
      step1_desc: 'Choose your preferred IPTV plan and place your order',
      step1_icon: '/images/icons/step1.svg',
      step2_title: '2. Get Your Account',
      step2_desc: 'Get your connection credentials after payment via email or WhatsApp',
      step2_icon: '/images/icons/step2.svg',
      step3_title: '3. Enjoy Your IPTV Service!',
      step3_desc: 'Enjoy more than 31,000 live TV channels and over 120,000 movies',
      step3_icon: '/images/icons/step3.svg',
      banner_title: 'ALL SPORTS CHANNELS AT YOUR FINGERTIPS!',
      banner_desc: 'Get ready for a premium sports experience with our IPTV service! Watch all your favorite sports channels live without breaking the bank. Say goodbye to extra fees and enjoy endless sports entertainment!',
      banner_image: '/images/sports_collage.png',
      bg_image_url: '/images/sports_stadium_bg.webp',
    },
  }

  const affiliateLinksContent: Record<string, Record<string, string>> = {
    fr: {
      badge: '🔗 Liens Partenaires',
      title: 'Nos Partenaires Officiels',
      subtitle: 'Découvrez nos partenaires de confiance pour optimiser votre expérience IPTV.',
    },
    es: {
      badge: '🔗 Enlaces de Socios',
      title: 'Nuestros Socios Oficiales',
      subtitle: 'Descubra nuestros socios de confianza para optimizar su experiencia de IPTV.',
    },
    en: {
      badge: '🔗 Partner Links',
      title: 'Our Official Partners',
      subtitle: 'Discover our trusted partners to optimize your IPTV experience.',
    },
  }

  // Save module content
  const allContent = [
    { moduleId: 'hero', data: heroContent },
    { moduleId: 'features', data: featuresContent },
    { moduleId: 'faq', data: faqContent },
    { moduleId: 'authority', data: authorityContent },
    { moduleId: 'pricing', data: pricingTitleContent },
    { moduleId: 'content', data: contentShowcaseContent },
    { moduleId: 'how_it_works', data: howItWorksContent },
    { moduleId: 'sports_marquee', data: sportsMarqueeContent },
    { moduleId: 'movies_marquee', data: moviesMarqueeContent },
    { moduleId: 'series_marquee', data: seriesMarqueeContent },
    { moduleId: 'devices', data: devicesContent },
    { moduleId: 'testimonials', data: testimonialsContent },
    { moduleId: 'affiliate_links', data: affiliateLinksContent },
  ]

  for (const { moduleId, data } of allContent) {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(data[locale])) {
        await prisma.moduleContent.upsert({
          where: { moduleId_locale_key: { moduleId, locale, key } },
          update: { value },
          create: { moduleId, locale, key, value },
        })
      }
    }
  }
  console.log('✅ Module content seeded')

  // ── Pricing Tiers & Plans ─────────────────────────────────
  // Clear old pricing data to avoid duplication on re-seed
  await prisma.planLabel.deleteMany()
  await prisma.pricingPlan.deleteMany()
  await prisma.tierLabel.deleteMany()
  await prisma.pricingTier.deleteMany()

  const pricingData = [
    {
      tierLabels: { fr: '1 Écran', es: '1 Pantalla', en: '1 Screen' },
      plans: [
        {
          price: 7.99, originalPrice: null, isRecommended: false,
          labels: {
            fr: { duration: '1 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 1 mois 1 écran à 7.99€" },
            es: { duration: '1 Mes', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 1 mes 1 pantalla a 7.99€' },
            en: { duration: '1 Month', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 1 month 1 screen plan at €7.99' },
          },
        },
        {
          price: 14.99, originalPrice: 23.97, isRecommended: true,
          labels: {
            fr: { duration: '3 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 37%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 3 mois 1 écran à 14.99€" },
            es: { duration: '3 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 37%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 3 meses 1 pantalla a 14.99€' },
            en: { duration: '3 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 37%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 3 month 1 screen plan at €14.99' },
          },
        },
        {
          price: 24.99, originalPrice: 47.94, isRecommended: false,
          labels: {
            fr: { duration: '6 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 48%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 6 mois 1 écran à 24.99€" },
            es: { duration: '6 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 48%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 6 meses 1 pantalla a 24.99€' },
            en: { duration: '6 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 48%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 6 month 1 screen plan at €24.99' },
          },
        },
        {
          price: 39.99, originalPrice: 95.88, isRecommended: false,
          labels: {
            fr: { duration: '12 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 58%","MEILLEUR TARIF"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 12 mois 1 écran à 39.99€" },
            es: { duration: '12 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 58%","MEJOR PRECIO"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 12 meses 1 pantalla a 39.99€' },
            en: { duration: '12 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 58%","BEST VALUE"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 12 month 1 screen plan at €39.99' },
          },
        },
      ],
    },
    {
      tierLabels: { fr: '2 Écrans', es: '2 Pantallas', en: '2 Screens' },
      plans: [
        {
          price: 11.99, originalPrice: null, isRecommended: false,
          labels: {
            fr: { duration: '1 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 1 mois 2 écrans à 11.99€" },
            es: { duration: '1 Mes', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 1 mes 2 pantallas a 11.99€' },
            en: { duration: '1 Month', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 1 month 2 screens plan at €11.99' },
          },
        },
        {
          price: 24.99, originalPrice: 35.97, isRecommended: true,
          labels: {
            fr: { duration: '3 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 30%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 3 mois 2 écrans à 24.99€" },
            es: { duration: '3 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 30%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 3 meses 2 pantallas a 24.99€' },
            en: { duration: '3 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 30%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 3 month 2 screens plan at €24.99' },
          },
        },
        {
          price: 39.99, originalPrice: 71.94, isRecommended: false,
          labels: {
            fr: { duration: '6 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 44%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 6 mois 2 écrans à 39.99€" },
            es: { duration: '6 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 44%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 6 meses 2 pantallas a 39.99€' },
            en: { duration: '6 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 44%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 6 month 2 screens plan at €39.99' },
          },
        },
        {
          price: 64.99, originalPrice: 143.88, isRecommended: false,
          labels: {
            fr: { duration: '12 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 55%","MEILLEUR TARIF"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 12 mois 2 écrans à 64.99€" },
            es: { duration: '12 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 55%","MEJOR PRECIO"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 12 meses 2 pantallas a 64.99€' },
            en: { duration: '12 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 55%","BEST VALUE"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 12 month 2 screens plan at €64.99' },
          },
        },
      ],
    },
    {
      tierLabels: { fr: '3 Écrans', es: '3 Pantallas', en: '3 Screens' },
      plans: [
        {
          price: 14.99, originalPrice: null, isRecommended: false,
          labels: {
            fr: { duration: '1 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 1 mois 3 écrans à 14.99€" },
            es: { duration: '1 Mes', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 1 mes 3 pantallas a 14.99€' },
            en: { duration: '1 Month', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 1 month 3 screens plan at €14.99' },
          },
        },
        {
          price: 34.99, originalPrice: 44.97, isRecommended: true,
          labels: {
            fr: { duration: '3 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 22%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 3 mois 3 écrans à 34.99€" },
            es: { duration: '3 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 22%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 3 meses 3 pantallas a 34.99€' },
            en: { duration: '3 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 22%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 3 month 3 screens plan at €34.99' },
          },
        },
        {
          price: 54.99, originalPrice: 89.94, isRecommended: false,
          labels: {
            fr: { duration: '6 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 39%"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 6 mois 3 écrans à 54.99€" },
            es: { duration: '6 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 39%"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 6 meses 3 pantallas a 54.99€' },
            en: { duration: '6 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 39%"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 6 month 3 screens plan at €54.99' },
          },
        },
        {
          price: 89.99, originalPrice: 179.88, isRecommended: false,
          labels: {
            fr: { duration: '12 Mois', features: '["26 000+ chaînes","HD & 4K","Anti-coupure","Support 24/7","Économisez 50%","MEILLEUR TARIF"]', ctaText: "S'abonner", waMessage: "Bonjour, je veux l'abonnement 12 mois 3 écrans à 89.99€" },
            es: { duration: '12 Meses', features: '["26 000+ canales","HD y 4K","Anti-corte","Soporte 24/7","Ahorra 50%","MEJOR PRECIO"]', ctaText: 'Suscribirse', waMessage: 'Hola, quiero el plan 12 meses 3 pantallas a 89.99€' },
            en: { duration: '12 Months', features: '["26,000+ channels","HD & 4K","Anti-buffering","24/7 Support","Save 50%","BEST VALUE"]', ctaText: 'Subscribe', waMessage: 'Hello, I want the 12 month 3 screens plan at €89.99' },
          },
        },
      ],
    },
  ]

  let tierOrder = 0
  for (const tierData of pricingData) {
    const tier = await prisma.pricingTier.create({
      data: { sortOrder: tierOrder++ },
    })
    for (const locale of locales) {
      await prisma.tierLabel.create({
        data: { tierId: tier.id, locale, name: tierData.tierLabels[locale] },
      })
    }
    let planOrder = 0
    for (const planData of tierData.plans) {
      const plan = await prisma.pricingPlan.create({
        data: {
          tierId: tier.id,
          sortOrder: planOrder++,
        },
      })
      for (const locale of locales) {
        const lbl = planData.labels[locale]
        await prisma.planLabel.create({
          data: {
            planId: plan.id,
            locale,
            duration: lbl.duration,
            features: lbl.features,
            ctaText: lbl.ctaText,
            waMessage: lbl.waMessage,
            price: planData.price,
            originalPrice: planData.originalPrice,
            isRecommended: planData.isRecommended,
            currencySymbol: '€',
          },
        })
      }
    }
  }

  console.log('✅ Pricing tiers & plans seeded')

  // Seed default How It Works banner image
  const existingHowItWorksBg = await prisma.howItWorksBgImage.findFirst({
    where: { url: '/images/sports_collage.png', type: 'banner' }
  })
  if (!existingHowItWorksBg) {
    await prisma.howItWorksBgImage.create({
      data: { url: '/images/sports_collage.png', type: 'banner' }
    })
    console.log('✅ Default HowItWorks banner image seeded')
  }

  const existingStadiumBg = await prisma.howItWorksBgImage.findFirst({
    where: { url: '/images/sports_stadium_bg.webp', type: 'background' }
  })
  if (!existingStadiumBg) {
    await prisma.howItWorksBgImage.create({
      data: { url: '/images/sports_stadium_bg.webp', type: 'background' }
    })
    console.log('✅ Default HowItWorks stadium background seeded')
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log('   Admin login: admin / admin123admin')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
