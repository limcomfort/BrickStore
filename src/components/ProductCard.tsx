import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, discountPercent, isMediaPopulated } from '@/lib/media'
import type { Product } from '@/payload-types'

export function ProductCard({ product }: { product: Product }) {
  const category = product.category as { title?: string; slug?: string } | null
  const image = product.heroImage
  const discount = discountPercent(product.price, product.oldPrice)

  return (
    <article className="product-card">
      <Link className="product-image" href={`/catalog/${product.slug}`}>
        {isMediaPopulated(image) && image.url && (
          <Image
            src={image.url}
            alt={image.alt || product.title}
            width={800}
            height={600}
            sizes="(max-width: 720px) 100vw, 340px"
          />
        )}
        {discount && <span className="badge badge-red">−{discount}%</span>}
        {!product.inStock && <span className="badge badge-gray">Под заказ</span>}
      </Link>

      <div className="product-body">
        <small className="product-cat">{category?.title}</small>
        <h3 className="product-title">
          <Link href={`/catalog/${product.slug}`}>{product.title}</Link>
        </h3>

        <div className="product-meta">
          {product.pieces ? <span>🧩 {product.pieces} деталей</span> : null}
          {product.ageMin ? <span>👤 {product.ageMin}+</span> : null}
        </div>

        <div className="product-footer">
          <div className="price-block">
            <span className="price">{formatPrice(product.price)}</span>
            {product.oldPrice ? <s className="old-price">{formatPrice(product.oldPrice)}</s> : null}
          </div>
          <Link className="btn btn-sm btn-outline" href={`/catalog/${product.slug}`}>
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  )
}
