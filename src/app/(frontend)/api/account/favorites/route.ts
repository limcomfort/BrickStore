import config from '@payload-config'
import { getPayload } from 'payload'
import { getSessionCustomerFromRequest } from '@/lib/customer-session'
import type { Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

const UNAUTHORIZED = { error: 'Требуется вход в кабинет' }

/** Приводит relation-поле к числовому id (может прийти и объектом). */
function toId(value: number | { id: number } | null): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return typeof value.id === 'number' ? value.id : null
}

/**
 * Избранное текущего покупателя.
 * `format=full` возвращает готовые карточки товаров — кабинет рисует их без второго запроса.
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomerFromRequest(payload, request)
  if (!customer) return json(UNAUTHORIZED, 401)

  const full = new URL(request.url).searchParams.get('format') === 'full'

  const found = await payload.find({
    collection: 'favorites',
    where: { customer: { equals: customer.id } },
    limit: 100,
    depth: 1,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const rows = found.docs
    .map((doc) => ({ favoriteId: doc.id, product: doc.product, productId: toId(doc.product) }))
    .filter((row): row is { favoriteId: number; product: Product; productId: number } =>
      typeof row.product === 'object' && row.product !== null && row.productId !== null,
    )

  if (!full) return json({ productIds: rows.map((row) => row.productId) })

  return json({
    productIds: rows.map((row) => row.productId),
    products: rows.map((row) => row.product),
  })
}

/** Добавить товар. Повторное добавление не создаёт дубль. */
export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomerFromRequest(payload, request)
  if (!customer) return json(UNAUTHORIZED, 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Некорректный запрос' }, 400)
  }

  const productId = Number((body as { productId?: unknown })?.productId)
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ error: 'Не указан товар' }, 400)
  }

  const product = await payload
    .findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!product) return json({ error: 'Товар не найден' }, 404)

  const existing = await payload.find({
    collection: 'favorites',
    where: { and: [{ customer: { equals: customer.id } }, { product: { equals: productId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) return json({ added: false, alreadyExists: true })

  // Гонка двух одновременных запросов упадёт на уникальном индексе — это ожидаемо
  try {
    await payload.create({
      collection: 'favorites',
      data: { customer: customer.id, product: productId },
      overrideAccess: true,
    })
  } catch (error) {
    payload.logger.warn({ err: error, msg: 'Избранное: конфликт при вставке' })
    return json({ added: false, alreadyExists: true })
  }

  return json({ added: true }, 201)
}

/** Убрать товар из избранного. Удаление отсутствующей записи — не ошибка. */
export async function DELETE(request: Request) {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomerFromRequest(payload, request)
  if (!customer) return json(UNAUTHORIZED, 401)

  const productId = Number(new URL(request.url).searchParams.get('productId'))
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ error: 'Не указан товар' }, 400)
  }

  await payload.delete({
    collection: 'favorites',
    where: { and: [{ customer: { equals: customer.id } }, { product: { equals: productId } }] },
    overrideAccess: true,
  })

  return json({ removed: true })
}
