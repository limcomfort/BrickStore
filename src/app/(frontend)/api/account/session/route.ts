import config from '@payload-config'
import { getPayload } from 'payload'
import {
  EMAIL_RE,
  clearSession,
  getSessionCustomer,
  issueSession,
  normalizeIdentity,
} from '@/lib/customer-session'
import { checkRateLimit, clientKey, resetRateLimit } from '@/lib/rate-limit'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Текущий покупатель — нужен шапке и кабинету для первичного рендера. */
export async function GET() {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomer(payload)
  return json({ customer })
}

/**
 * Вход по имени и e-mail. Пароля нет: первый вход создаёт покупателя,
 * повторный — подхватывает существующего по нормализованному e-mail.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config })

  const limit = checkRateLimit(`login:${clientKey(request)}`)
  if (!limit.allowed) {
    return json(
      { error: `Слишком много попыток. Повторите через ${limit.retryAfterSec} с.` },
      429,
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Некорректный запрос' }, 400)
  }

  const { email, name } = normalizeIdentity(
    (body as { email?: unknown })?.email,
    (body as { name?: unknown })?.name,
  )

  if (!EMAIL_RE.test(email)) return json({ error: 'Укажите корректный e-mail' }, 400)
  if (name.length < 2) return json({ error: 'Укажите имя (минимум 2 символа)' }, 400)
  if (name.length > 80) return json({ error: 'Имя длиннее 80 символов' }, 400)

  try {
    const existing = await payload.find({
      collection: 'customers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const customer =
      existing.docs[0] ||
      (await payload.create({
        collection: 'customers',
        data: { email, name },
        overrideAccess: true,
      }))

    // Сессию пишем сами, а cookie ставим в том же ответе — иначе
    // `next/headers` не успевает применить Set-Cookie к JSON-ответу
    await issueSession(payload, customer.id, await cookies(), {
      touch: true,
      secure: new URL(request.url).protocol === 'https:',
    })
    resetRateLimit(`login:${clientKey(request)}`)

    return json({ customer: { id: customer.id, email: customer.email, name: customer.name } })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Не удалось выполнить вход покупателя' })
    return json({ error: 'Не удалось выполнить вход. Попробуйте ещё раз.' }, 500)
  }
}

export async function DELETE(request: Request) {
  const payload = await getPayload({ config })
  await clearSession(payload)
  resetRateLimit(`login:${clientKey(request)}`)
  return json({ ok: true })
}
