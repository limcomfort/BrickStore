import type { Metadata } from 'next'
import Link from 'next/link'
import { getBrickPayload, getCategories, getSettings } from '@/lib/data'
import { ProductCard } from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'BrickStore — интернет-магазин конструкторов LEGO',
  description: 'Каталог наборов LEGO: Город, Техник, Космос, Креатор, Друзья и Юниор.',
}

export default async function HomePage() {
  const payload = await getBrickPayload()

  const [settings, categories, featured] = await Promise.all([
    getSettings(),
    getCategories(),
    payload.find({
      collection: 'products',
      depth: 1,
      where: { featured: { equals: true } },
      limit: 6,
    }),
  ])

  const latest =
    featured.docs.length >= 4
      ? []
      : await payload.find({ collection: 'products', depth: 1, sort: '-createdAt', limit: 8 })

  const products = [...featured.docs, ...(Array.isArray(latest) ? [] : latest.docs)].slice(0, 8)

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <small className="hero-kicker">
              {new Date().getFullYear()} · Новинки каждую неделю
            </small>
            <h1>
              {settings?.heroHeading || 'Собирай свой мир из'}{' '}
              <span className="accent">{settings?.heroHighlight || 'кирпичиков'}</span>
            </h1>
            <p className="hero-text">
              {settings?.heroText ||
                'BrickStore — интернет-магазин конструкторов LEGO. От первых кубиков до инженерных моделей.'}
            </p>
            <div className="hero-actions">
              <Link className="btn btn-yellow" href="/catalog">
                {settings?.heroCtaLabel || 'Смотреть каталог'}
              </Link>
              <a className="btn btn-ghost" href="#featured">
                Хиты недели
              </a>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="brick brick-red" />
            <div className="brick brick-yellow" />
            <div className="brick brick-blue" />
            <div className="brick brick-green" />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Категории */}
      <section className="wrap section" id="categories">
        <div className="section-head">
          <h2>Темы наборов</h2>
          <Link href="/catalog" className="more-link">
            Весь каталог →
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link className={`category-card cat-${cat.color}`} key={cat.id} href={`/catalog?category=${cat.slug}`}>
              <span className="cat-icon" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- Хиты */}
      <section className="wrap section" id="featured">
        <div className="section-head">
          <h2>Хиты недели</h2>
          <Link href="/catalog" className="more-link">
            Смотреть все →
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {products.length === 0 && <p className="empty">Товары скоро появятся. Загляните позже!</p>}
      </section>

      {/* -------------------------------------------------------- Плюсы */}
      <section className="wrap section">
        <div className="benefits">
          <div className="benefit">
            <span className="benefit-icon">🚚</span>
            <div>
              <h3>Доставка за 1–2 дня</h3>
              <p>Курьером или в пункт выдачи — бесплатно от 5 000 ₽</p>
            </div>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🛡️</span>
            <div>
              <h3>Гарантия 2 года</h3>
              <p>Работаем официально: чек, обмен и возврат 30 дней</p>
            </div>
          </div>
          <div className="benefit">
            <span className="benefit-icon">💳</span>
            <div>
              <h3>Оплата как удобно</h3>
              <p>Карта, СБП или рассрочка на 4 месяца без переплат</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
