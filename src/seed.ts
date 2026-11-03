import 'dotenv/config'

import { getPayload, type Payload } from 'payload'

import config from './payload.config'

type CategorySeed = {
  title: string
  slug: string
  color: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'purple'
  description: string
}

const categories: CategorySeed[] = [
  {
    title: 'Город',
    slug: 'city',
    color: 'blue',
    description: 'Строим свой LEGO-город: полиция, пожарные, стройки и каждодневные истории.',
  },
  {
    title: 'Техник',
    slug: 'technic',
    color: 'red',
    description: 'Модели с подвижными узлами, поршнями и рулевым управлением для инженеров.',
  },
  {
    title: 'Космос',
    slug: 'space',
    color: 'purple',
    description: 'Орбитальные станции, роверы и миссии на далёкие планеты.',
  },
  {
    title: 'Креатор 3-в-1',
    slug: 'creator',
    color: 'orange',
    description: 'Один набор — три разных модели. Пересобирай и играй по-новому.',
  },
  {
    title: 'Друзья',
    slug: 'friends',
    color: 'green',
    description: 'Сюжетные наборы о городе Хартфейл-Сити и его жителях.',
  },
  {
    title: 'Юниор',
    slug: 'junior',
    color: 'yellow',
    description: 'Первые наборы для дошкольников: крупные детали и понятные инструкции.',
  },
]

type ProductSeed = {
  title: string
  slug: string
  article: string
  category: string
  price: number
  oldPrice?: number
  pieces: number
  ageMin: number
  inStock?: boolean
  featured?: boolean
  summary: string
  description: string[]
  color: string
  color2?: string
}

const products: ProductSeed[] = [
  {
    title: 'Пожарная часть и вертолёт',
    slug: 'fire-station-helicopter',
    article: '60385',
    category: 'city',
    price: 11990,
    oldPrice: 13990,
    pieces: 1076,
    ageMin: 6,
    featured: true,
    summary: 'Двухэтажная пожарная часть, вертолёт со съёмным винтом и три минифигурки спасателей.',
    description: [
      'Пожарная часть — сердце LEGO-города. Здесь всегда кипит работа: у гаражей стоят машины, внизу — диспетчерская, наверху — комната отдыха команды.',
      'В набор входят пожарный вертолёт с вращающимся винтом, съёмные язычки «огня» на стенах и три минифигурки: командир, механик и пилот.',
      'Модель отлично сочетается с любыми городскими наборами и достраивает целый квартал.',
    ],
    color: '#E3000B',
    color2: '#FFCE00',
  },
  {
    title: 'Полицейский участок',
    slug: 'police-station',
    article: '60316',
    category: 'city',
    price: 12990,
    pieces: 1077,
    ageMin: 6,
    summary: 'Штаб полиции с камерами, автопарком и погоней за красным хэтчбеком.',
    description: [
      'Трёхэтажный участок с офисом шефа, камерами для задержанных и гаражом на две машины.',
      'Набор включает внедорожник и мотоцикл полиции, барьеры с кнопочной сигнализацией и шесть минифигурок.',
      'Дополнительные детали дорожной обстановки помогут разыграть целую сцену погони.',
    ],
    color: '#0079C1',
    color2: '#FFCE00',
  },
  {
    title: 'Гоночный трейлер',
    slug: 'race-trailer',
    article: '60406',
    category: 'city',
    price: 4690,
    pieces: 273,
    ageMin: 5,
    summary: 'Гоночный болид на трейлере и мини-станция техобслуживания.',
    description: [
      'Мощный тягач с прицепом-платформой увозит болид прямо к трассе, где уже ждут механики.',
      'Внутри — съёмный инструмент, запасные шины и подиум для победителей.',
    ],
    color: '#F57C20',
  },
  {
    title: 'Орбитальная станция',
    slug: 'orbital-station',
    article: '60433',
    category: 'space',
    price: 10490,
    oldPrice: 11990,
    pieces: 1101,
    ageMin: 7,
    featured: true,
    summary: 'Модульная станция с доком для стыковки, лабораторией и луноходом.',
    description: [
      'Орбитальная станция собирается из модулей: жилая секция, обсерватория с телескопом и доки для стыковки.',
      'Луноход с манипулятором и минифигурки астронавтов открывают сценарии для долгих космических миссий.',
    ],
    color: '#6E36A6',
    color2: '#0079C1',
  },
  {
    title: 'Инопланетный луноход',
    slug: 'alien-rover',
    article: '60371',
    category: 'space',
    price: 5490,
    pieces: 296,
    ageMin: 6,
    summary: 'Шестиколёсный ровер с распечаткой карты и светящимися кристаллами.',
    description: [
      'Ровер едет по кратеру и собирает куски кристаллов, а находки фиксируются на планшете пилота.',
      'Прочные шасси, солнечная батарея и интересный набор деталей делают игрушку по-настоящему живой.',
    ],
    color: '#6E36A6',
    color2: '#FFCE00',
  },
  {
    title: 'Суперкар с поршнями',
    slug: 'super-car',
    article: '42161',
    category: 'technic',
    price: 14290,
    pieces: 931,
    ageMin: 9,
    featured: true,
    summary: 'Гоночный суперкар с рабочим V6-мотором, рулём и цепной передачей.',
    description: [
      'Тяни-толкай: рычаг ручного стартера раскручивает поршни, а рулевое колесо поворачивает передние колёса.',
      'Кузов в настоящих пропорциях LEGO Technic: спойлер, шины с глубоким протектором и наклейки-графики.',
    ],
    color: '#D0201B',
    color2: '#16151A',
  },
  {
    title: 'Кран-гигант',
    slug: 'giant-crane',
    article: '42052',
    category: 'technic',
    price: 13990,
    pieces: 886,
    ageMin: 10,
    summary: 'Башенный кран высотой 85 см с крюком, противовесом и грузовой тележкой.',
    description: [
      'Полноценная лебёдка поднимает груз, а тележка двигается по горизонтальной штанге.',
      'Модель пересобирается в версию мобильного крана — набор получается 2-в-1.',
    ],
    color: '#FFCE00',
    color2: '#16151A',
  },
  {
    title: 'Дом меча 3-в-1',
    slug: 'dream-home',
    article: '31139',
    category: 'creator',
    price: 10490,
    pieces: 1055,
    ageMin: 12,
    featured: true,
    summary: 'Современный дом с бассейном, который пересобирается в виллу и лофт-студию.',
    description: [
      'Стеклянные панели, балкон и бассейн: набор Creator 3-в-1 с интерьером на четыре комнаты.',
      'Альтернативные модели: вилла с садом и городская лофт-студия.',
    ],
    color: '#F57C20',
    color2: '#2C8C3B',
  },
  {
    title: 'Пляжный кемпер 3-в-1',
    slug: 'beach-camper',
    article: '31138',
    category: 'creator',
    price: 5990,
    pieces: 502,
    ageMin: 8,
    summary: 'Ретро-фургон с доской для сёрфа: кемпер, спасательная станция и кафе на пляже.',
    description: [
      'Открытые боковые двери, раскладной стол и мини-кухня: отличная основа для летних историй.',
    ],
    color: '#0079C1',
    color2: '#FFCE00',
  },
  {
    title: 'Кафе в парке',
    slug: 'city-park-cafe',
    article: '41737',
    category: 'friends',
    price: 6190,
    oldPrice: 6990,
    pieces: 475,
    ageMin: 6,
    summary: 'Кафе с прилавком мороженого, фонтаном и уютной террасой.',
    description: [
      'Три минифигурки подруг, съёмный навес и куча аксессуаров для кофейных сцен.',
    ],
    color: '#2C8C3B',
    color2: '#FFCE00',
  },
  {
    title: 'Домик на дереве',
    slug: 'tree-house',
    article: '41724',
    category: 'friends',
    price: 8990,
    pieces: 711,
    ageMin: 8,
    summary: 'Домик на дереве с канатной дорогой, качелями и спальнями наверху.',
    description: [
      'Подъёмная корзина доставляет друзей наверх, а внутри — спальня, кухня и винтажные фонарики.',
    ],
    color: '#2C8C3B',
    color2: '#6E36A6',
  },
  {
    title: 'Приключения динозавров',
    slug: 'dino-adventure',
    article: '11039',
    category: 'junior',
    price: 3490,
    pieces: 138,
    ageMin: 4,
    summary: 'Набор с крупными деталями: три динозаврика и джунгли для первых сюжетов.',
    description: [
      'Крупные кубики LEGO Juniors, три динозавра и джунгли: первые сюжеты для смелых исследователей.',
    ],
    color: '#2C8C3B',
    color2: '#FFCE00',
  },
]

/* ---------------------------------------------------------------- */
/* SVG illustration generator                                        */
/* ---------------------------------------------------------------- */

function shade(hex: string, f: number): string {
  const m = hex.replace('#', '')
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(parseInt(m.slice(0, 2), 16) * f)
  const g = clamp(parseInt(m.slice(2, 4), 16) * f)
  const b = clamp(parseInt(m.slice(4, 6), 16) * f)
  return `rgb(${r},${g},${b})`
}

type Stud = { x: number; y: number }

function topStuds(): Stud[] {
  const studs: Stud[] = []
  for (const t of [0.85, 0.5, 0.15]) {
    for (const u of [0.14, 0.38, 0.62, 0.86]) {
      studs.push({ x: 180 + 100 * t + 440 * u, y: 320 - 50 * t - 50 * u })
    }
  }
  return studs
}

function brickSVG(color: string, color2?: string, mode: 'single' | 'stack' = 'single'): string {
  const light = shade(color, 1.25)
  const dark = shade(color, 0.72)
  const darker = shade(color, 0.55)
  const studFill = shade(color, 1.42)
  const studs = topStuds()
    .map(
      (s) =>
        `<ellipse cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" rx="27" ry="13" fill="${studFill}" stroke="${dark}" stroke-width="2"/>`,
    )
    .join('')

  const stack =
    mode === 'stack'
      ? `
    <g transform="translate(-90 -95) scale(0.82)" opacity="0.94">
      <polygon points="180,320 280,270 720,270 620,320" fill="${shade(color2 ?? color, 1.18)}"/>
      <polygon points="180,320 620,320 620,460 180,460" fill="${color2 ?? color}"/>
      <polygon points="620,320 720,270 720,410 620,460" fill="${darker}"/>
      ${topStuds()
        .map(
          (s) =>
            `<ellipse cx="${s.x.toFixed(1)}" cy="${(s.y - 30).toFixed(1)}" rx="27" ry="13" fill="${shade(color2 ?? color, 1.4)}" stroke="${dark}" stroke-width="2"/>`,
        )
        .join('')}
    </g>`
      : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="0.25" stop-color="${color}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="#f3f2ee"/>
  <g stroke="#e6e4dd" fill="none" stroke-width="2">
    ${Array.from({ length: 10 })
      .map(
        (_, i) =>
          `<circle cx="${(i % 5) * 180 + 60}" cy="${Math.floor(i / 5) * 360 + 80}" r="34"/>`,
      )
      .join('')}
  </g>
  <ellipse cx="440" cy="500" rx="250" ry="26" fill="rgba(20,20,25,0.08)"/>
  ${stack}
  <polygon points="180,320 280,270 720,270 620,320" fill="${light}"/>
  <polygon points="180,320 620,320 620,460 180,460" fill="url(#body)"/>
  <polygon points="620,320 720,270 720,410 620,460" fill="${darker}"/>
  <polygon points="180,320 280,270 720,270 620,320" fill="none" stroke="${dark}" stroke-width="2"/>
  ${studs}
</svg>`
}

/* ---------------------------------------------------------------- */
/* Seed                                                              */
/* ---------------------------------------------------------------- */

async function run(): Promise<void> {
  console.log('Seed: starting…')
  const payload = await getPayload({ config })
  console.log('Seed: payload ready')

  try {
    await seedEverything(payload)
    console.log('Seed: complete ✓')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

async function seedEverything(payload: Payload): Promise<void> {
  // Очистка
  for (const slug of ['products', 'categories', 'media']) {
    const { docs } = await payload.find({
      collection: slug,
      limit: 1000,
      depth: 0,
    })
    for (const doc of docs) {
      await payload.delete({ collection: slug, id: doc.id })
    }
  }

  // 1. Админ
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@brickstore.dev'
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'BrickStore2026!',
      },
    })
    console.log(`Created admin user: ${adminEmail}`)
  }

  // 2. Настройки сайта
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      announcement: 'Бесплатная доставка при заказе от 5 000 ₽ · Куб-лига: скидка 20% на второй набор',
      heroHeading: 'Собирай свой мир из',
      heroHighlight: 'кирпичиков',
      heroText:
        'BrickStore — интернет-магазин конструкторов LEGO. Более 12 витринных наборов: от первых кубиков LEGO Juniors до инженерных моделей Техник.',
      heroCtaLabel: 'Смотреть каталог',
      contactPhone: '+7 (900) 123-45-67',
      contactEmail: 'hello@brickstore.dev',
      footerNote: 'Собрано на Next.js (SSR) и Headless CMS Payload.',
    },
  })

  // 3. Категории
  const categoryIds: Record<string, string | number> = {}
  for (const cat of categories) {
    const created = await payload.create({ collection: 'categories', data: cat })
    categoryIds[cat.slug] = created.id
  }
  console.log(`Created ${categories.length} categories`)

  // 4. Товары + иллюстрации
  for (const [i, p] of products.entries()) {
    const draw = (mode: 'single' | 'stack', color: string, color2?: string) =>
      Buffer.from(brickSVG(color, color2, mode), 'utf-8')

    const name = p.slug
    const hero = await payload.create({
      collection: 'media',
      data: { alt: `${p.title} — главное изображение` },
      file: {
        data: draw(i % 3 === 2 ? 'stack' : 'single', p.color, p.color2),
        mimetype: 'image/svg+xml',
        name: `${name}-hero.svg`,
        size: 1,
      },
    })
    const alt = await payload.create({
      collection: 'media',
      data: { alt: `${p.title} — вид сверху` },
      file: {
        data: draw('stack', p.color2 ?? p.color, p.color),
        mimetype: 'image/svg+xml',
        name: `${name}-top.svg`,
        size: 1,
      },
    })

    const category = categoryIds[p.category]
    await payload.create({
      collection: 'products',
      data: {
        title: p.title,
        slug: p.slug,
        article: p.article,
        category,
        summary: p.summary,
        description: {
          root: {
            children: p.description.map((text) => ({
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', version: 1, text }],
            })),
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        price: p.price,
        ...(p.oldPrice ? { oldPrice: p.oldPrice } : {}),
        pieces: p.pieces,
        ageMin: p.ageMin,
        inStock: p.inStock !== false,
        featured: Boolean(p.featured),
        heroImage: hero.id,
        gallery: [hero.id, alt.id],
      },
    })
  }

  console.log(`Created ${products.length} products`)
}

void run()
