import type { Media } from '@/payload-types'

/** Создаётся один раз на модуль: конструктор заметно дороже самого `format`. */
const PRICE_FORMAT = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatPrice(value: number): string {
  return PRICE_FORMAT.format(value)
}

export function isMediaPopulated(image: unknown): image is Media {
  return Boolean(
    image && typeof image === 'object' && 'url' in image && typeof (image as Media).url === 'string',
  )
}

/** Из строки телефона делает значение для href: `tel:` — только цифры и ведущий «+». */
export function toTelHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  return digits ? `tel:+${digits}` : ''
}

export function discountPercent(price: number, oldPrice?: number | null): number | null {
  if (typeof oldPrice !== 'number' || oldPrice <= price) return null
  return Math.round((1 - price / oldPrice) * 100)
}

/** Есть ли у товара корректная «цена до скидки»: она должна быть больше текущей. */
export function hasDiscount(price: number, oldPrice?: number | null): oldPrice is number {
  return typeof oldPrice === 'number' && oldPrice > price
}
