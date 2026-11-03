import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getBrickPayload, getSettings } from '@/lib/data'
import { formatPrice, discountPercent, isMediaPopulated } from '@/lib/media'
import { ProductCard } from '@/components/ProductCard'
import type { Category, Media, Product } from '@/payload-types'

type Params = Promise<{ slug: string }>

async function findProduct(slug: string): Promise<Product | null> {
  const payload = await getBrickPayload()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) return { title: 'Набор не найден — BrickStore' }
  return {
    title: `${product.title} — купить в BrickStore`,
    description: product.summary || undefined,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()

  const payload = await getBrickPayload()
  const settings = await getSettings()

  const category = product.category as Category | null
  const hero = product.heroImage as Media | number
  const gallery = (product.gallery || []).filter(isMediaPopulated)

  const related = await payload.find({
    collection: 'products',
    depth: 1,
    where: {
      category: { equals: category?.id },
      id: { not_equals: product.id },
    },
    limit: 3,
  })

  const discount = discountPercent(product.price, product.oldPrice)
  const phone = settings?.contactPhone?.replace(/[^+\d]/g, '') || ''
  const mailto = `mailto:${settings?.contactEmail || ''}?subject=${encodeURIComponent(
    `Вопрос по набору «${product.title}» (арт. ${product.article})`,
  )}`

  return (
    <div className="wrap page">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/catalog">Каталог</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/catalog?category=${category.slug}`}>{category.title}</Link>
          </>
        )}
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      <div className="product-page">
        <div className="product-gallery">
          <div className="gallery-main">
            {isMediaPopulated(hero) && hero.url ? (
              <Image
                src={hero.url}
                alt={hero.alt || product.title}
                width={800}
                height={600}
                priority
                sizes="(max-width: 900px) 100vw, 560px"
              />
            ) : (
              <div className="image-placeholder">🧱</div>
            )}
            {discount ? <span className="badge badge-red badge-lg">−{discount}%</span> : null}
          </div>

          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((image) =>
                image.url ? (
                  <Image
                    key={image.id}
                    src={image.url}
                    alt={image.alt || product.title}
                    width={400}
                    height={300}
                    sizes="140px"
                  />
                ) : null,
              )}
            </div>
          )}
        </div>

        <div className="product-info">
          <small className="product-cat">{category?.title}</small>
          <h1>{product.title}</h1>

          <div className="product-meta">
            {product.article && <span className="article">Арт. {product.article}</span>}
            <span className={`stock ${product.inStock ? 'in' : 'out'}`}>
              {product.inStock ? '✓ В наличии' : 'Под заказ'}
            </span>
          </div>

          {product.summary && <p className="product-summary">{product.summary}</p>}

          <div className="buy-box">
            <div className="price-block price-lg">
              <span className="price">{formatPrice(product.price)}</span>
              {product.oldPrice ? <s className="old-price">{formatPrice(product.oldPrice)}</s> : null}
            </div>

            <div className="buy-actions">
              {phone ? (
                <a className="btn btn-red btn-lg" href={`tel:${phone}`}>
                  Заказать по телефону
                </a>
              ) : (
                <Link className="btn btn-red btn-lg" href="/catalog">
                  Перейти в каталог
                </Link>
              )}
              <a className="btn btn-outline btn-lg" href={mailto}>
                Задать вопрос
              </a>
            </div>

            <ul className="buy-notes">
              <li>Самовывоз из пункта выдачи — сегодня</li>
              <li>Курьером по городу — завтра, от 5 000 ₽ бесплатно</li>
              <li>Обмен и возврат в течение 30 дней</li>
            </ul>
          </div>

          <dl className="specs">
            {product.pieces ? (
              <>
                <dt>Деталей</dt>
                <dd>{product.pieces}</dd>
              </>
            ) : null}
            {product.ageMin ? (
              <>
                <dt>Возраст</dt>
                <dd>{product.ageMin}+</dd>
              </>
            ) : null}
            {category ? (
              <>
                <dt>Серия</dt>
                <dd>{category.title}</dd>
              </>
            ) : null}
            {product.article ? (
              <>
                <dt>Артикул</dt>
                <dd>{product.article}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {product.description ? (
        <section className="section product-description">
          <h2>Об этом наборе</h2>
          <RichText className="richtext" data={product.description} />
        </section>
      ) : null}

      {related.docs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Похожие наборы</h2>
            {category && (
              <Link className="more-link" href={`/catalog?category=${category.slug}`}>
                Вся серия →
              </Link>
            )}
          </div>
          <div className="product-grid">
            {related.docs.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
