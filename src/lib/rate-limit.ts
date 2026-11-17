type Bucket = { count: number; resetAt: number }

/**
 * Примитивный лимитер для входа: держит счётчик попыток в памяти процесса.
 * Достаточно, чтобы перебор e-mail стал невыгодным; при нескольких инстансах
 * нужен внешний стор (Redis), о чём сказано в рисках фичи.
 */
const buckets = new Map<string, Bucket>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }

  bucket.count += 1
  if (bucket.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  return { allowed: true, retryAfterSec: 0 }
}

/** Успешный вход сбрасывает счётчик этого ключа. */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

/** Адрес клиента из заголовков прокси; в dev это ::1 или 127.0.0.1. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'local'
}
