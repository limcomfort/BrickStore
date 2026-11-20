import config from '@payload-config'
import { getPayload } from 'payload'
import { getSessionCustomerFromRequest } from '@/lib/customer-session'
import type { Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

const UNAUTHORIZED = { error: 'Требуется вход в кабинет' }

/** Верхняя граница списка за один запрос — дальше отдаём пачками по `offset`. */
const FAVORITES_LIMIT = 100

/** Приводит relation-поле к числовому id (может прийти и объектом). */
function toId(value: number | { id: number } | null): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return typeof value.id === 'number' ? value.id : null
}

/**
 * Избранное текущего покупателя.
 * `format=full` возвращает готовые карточки товаров — кабинет рисует их без второго запроса.
 *
 * Список строится по `productId`, который берётся из самого relation-поля.
 * Раскрытие используется только для карточек: раньше строка
 * выбрасывалась целиком, если товар приходил числом, и избранное «пропадало».
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomerFromRequest(payload, request)
  if (!customer) return json(UNAUTHORIZED, 401)

  const searchParams = new URL(request.url).searchParams
  const full = searchParams.get('format') === 'full'
  const offset = Math.max(0, Number.parseInt(searchParams.get('offset') ?? '', 10) || 0)

  const found = await payload.find({
    collection: 'favorites',
    where: { customer: { equals: customer.id } },
    limit: FAVORITES_LIMIT,
    page: Math.floor(offset / FAVORITES_LIMIT) + 1,
    // `depth: 2` — не опечатка: первый уровень раскрывает `favorites.product`,
    // второй — `product.heroImage`. С `depth: 1` картинка приходила числом,
    // и в кабинете карточка рисовалась без изображения.
    depth: full ? 2 : 0,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const rows = found.docs
    .map((doc) => ({ product: doc.product, productId: toId(doc.product) }))
    // Товар мог быть удалён из каталога — тогда связь придёт `null`.
    // Такие записи в счётчик не попадают, но и остальные не ломают.
    .filter((row): row is { product: Product; productId: number } => row.productId !== null)

  const productIds = rows.map((row) => row.productId)
  // Клиент видит, что список усечён, и догружает остальное (BUG-09).
  //
  // Смещение считаем по документам, которые вернула база, а не по `rows`:
  // отфильтрованные записи с удалённым товаром иначе сдвигали бы окно
  // и одни и те же карточки приезжали бы повторно.
  const pagination = {
    totalDocs: found.totalDocs,
    totalPages: found.totalPages,
    hasMore: found.hasNextPage,
    nextOffset: found.hasNextPage ? offset + found.docs.length : null,
  }

  if (!full) return json({ productIds, ...pagination })

  // Товар мог не раскрыться (например, depth обрезан) — карточку подставляем только если она есть.
  const products = rows
    .map((row) => row.product)
    .filter((product): product is Product => typeof product === 'object' && product !== null)

  return json({ productIds, products, ...pagination })
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
