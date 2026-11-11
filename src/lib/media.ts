import type { Media } from '@/payload-types'

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function isMediaPopulated(image: unknown): image is Media {
  return Boolean(
    image && typeof image === 'object' && 'url' in image && typeof (image as Media).url === 'string',
  )
}

/** Из строки телефона делает значение для href: `tel:` — только цифры и ведущий «+». */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function discountPercent(price: number, oldPrice?: number | null): number | null {
  if (typeof oldPrice !== 'number' || oldPrice <= price) return null
  return Math.round((1 - price / oldPrice) * 100)
}

/** Есть ли у товара корректная «цена до скидки»: она должна быть больше текущей. */
export function hasDiscount(price: number, oldPrice?: number | null): oldPrice is number {
  return typeof oldPrice === 'number' && oldPrice > price
}
