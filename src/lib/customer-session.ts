import { createHash } from 'crypto'
import type { Payload } from 'payload'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, SESSION_TTL_MS } from '@/collections/Customers'
import type { Customer } from '@/payload-types'

export type SessionCustomer = Pick<Customer, 'id' | 'email' | 'name'>

export type CookieStore = Awaited<ReturnType<typeof cookies>>

/**
 * Токен сессии кладём в cookie и храним в БД не в открытом виде:
 * в базе лежит SHA-256 от токена. Утечка БД не даёт готовых cookie.
 * Дополнительный секрет не нужен: токен и так 256 бит энтропии,
 * а SHA-256 не имеет быстрого перебора для случайных строк.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Новый случайный токен сессии. */
export function createSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Кэш покупателя на время одного вызова: layout и хук заявки читают сессию повторно. */
type SessionCache = WeakMap<object, SessionCustomer | null>
const readCache: SessionCache = new WeakMap()

/**
 * Находит покупателя по токену из cookie.
 * Возвращает null для гостя, истёкшей сессии и неизвестного токена.
 * В рамках одного запроса результат мемоизируется по объекту `payload`.
 */
export async function getSessionCustomer(payload: Payload): Promise<SessionCustomer | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const cacheKey = payload as object
  if (readCache.has(cacheKey)) return readCache.get(cacheKey) ?? null

  const customer = await getCustomerByToken(payload, token)
  readCache.set(cacheKey, customer)
  return customer
}

/** Проверяет, что сессия не истекла; отсутствие даты считаем истёкшей. */
function isFresh(expiresAt: unknown): boolean {
  if (!expiresAt) return false
  const time = new Date(expiresAt as string).getTime()
  return Number.isFinite(time) && time > Date.now()
}

/**
 * Поиск покупателя по токену без доступа к cookie-хранилищу Next.
 * Нужен внутри хуков коллекций, куда передаётся сам запрос, а не контекст RSC.
 *
 * Срок сессии запрашиваем явным `select`: скрытые поля не попадают
 * в выборку по умолчанию, и `sessionExpiresAt` иначе окажется `undefined`.
 */
export async function getCustomerByToken(
  payload: Payload,
  token: string | undefined,
): Promise<SessionCustomer | null> {
  if (!token) return null

  const found = await payload.find({
    collection: 'customers',
    where: { sessionToken: { equals: hashToken(token) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const customer = found.docs[0]
  if (!customer) return null
  if (!isFresh(customer.sessionExpiresAt)) return null

  return { id: customer.id, email: customer.email, name: customer.name }
}

type IssueOptions = {
  /** Проставляем в `lastSeenAt` — только при явном входе, не в каждом запросе. */
  touch?: boolean
  /**
   * `Secure` ставим только для https. Если привязать флаг к `NODE_ENV`,
   * `npm run start` на `http://localhost` получает cookie, которую браузер
   * молча отбрасывает, и вход «не работает» без единой ошибки.
   */
  secure?: boolean
}

/**
 * Выдаёт новую сессию покупателю и ставит cookie в переданный store.
 * Вызывать с `await cookies()` из Route Handler: `Set-Cookie` тогда
 * попадает в тот же ответ, что и JSON.
 */
export async function issueSession(
  payload: Payload,
  customerId: number,
  store: CookieStore,
  options: IssueOptions = {},
): Promise<string> {
  const token = createSessionToken()

  await payload.update({
    collection: 'customers',
    id: customerId,
    data: {
      sessionToken: hashToken(token),
      sessionExpiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      ...(options.touch ? { lastSeenAt: new Date().toISOString() } : {}),
    },
    overrideAccess: true,
  })

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secure ?? false,
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })

  return token
}

/** Гасит сессию: чистим токен в БД и удаляем cookie. */
export async function clearSession(payload: Payload): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (token) {
    const found = await payload.find({
      collection: 'customers',
      where: { sessionToken: { equals: hashToken(token) } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const customer = found.docs[0]
    if (customer) {
      await payload.update({
        collection: 'customers',
        id: customer.id,
        data: { sessionToken: null, sessionExpiresAt: null },
        overrideAccess: true,
      })
    }
  }

  store.delete(SESSION_COOKIE)
}

/** Нормализация входа: e-mail в нижний регистр, имя без двойных пробелов. */
export function normalizeIdentity(email: unknown, name: unknown) {
  return {
    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
    name: typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '',
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
